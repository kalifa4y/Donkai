// Supabase Edge Function — create-checkout (SasPay & Mobile Money Integration)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SASPAY_SECRET_KEY = Deno.env.get('SASPAY_SECRET_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const {
      campaign_id,
      amount,
      donor_name,
      donor_email,
      is_anonymous,
      message,
      payment_method,
      idempotency_key,
      return_url,
      returnUrl,
    } = await req.json()

    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount < 100) {
      return new Response(
        JSON.stringify({ error: 'Le montant minimum est de 100 FCFA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: 'campaign_id manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Protection contre les doubles traitements (Idempotence)
    if (idempotency_key) {
      const { data: existingDonation } = await supabase
        .from('donations')
        .select('id, payment_session_id')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle()

      if (existingDonation) {
        return new Response(
          JSON.stringify({
            donation_id: existingDonation.id,
            already_processed: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 2. Vérifier que la campagne existe et est active
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('id, title, status, user_id')
      .eq('id', campaign_id)
      .single()

    if (campError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Collecte introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (campaign.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Cette collecte n’accepte plus de contributions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Calcul strict des frais côté serveur (5% uniquement)
    const fee = Math.round(parsedAmount * 0.05)
    const netAmount = Math.max(0, parsedAmount - fee)

    // 4. Enregistrer la contribution en état "pending"
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        campaign_id: campaign.id,
        amount: parsedAmount,
        fee,
        net_amount: netAmount,
        currency: 'XOF',
        donor_name: is_anonymous ? null : (donor_name || null),
        donor_email: donor_email || null,
        is_anonymous: Boolean(is_anonymous),
        message: message || null,
        payment_method: payment_method || 'orange',
        status: 'pending',
        idempotency_key: idempotency_key || null,
      })
      .select('id')
      .single()

    if (donationError || !donation) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement de la contribution" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Initier la session de paiement sécurisée auprès de l'agrégateur SasPay
    if (!SASPAY_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Passerelle de paiement SasPay non configurée sur le serveur.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const saspayPayload = {
      amount: `${parsedAmount}.00`,
      currency: 'XOF',
      description: `Soutien : ${campaign.title}`,
      customer_name: is_anonymous ? 'Anonyme' : (donor_name || 'Anonyme'),
      customer_email: donor_email || 'donateur@donkai.app',
      return_url: return_url || returnUrl || '',
      metadata: {
        donation_id: donation.id,
        campaign_id: campaign.id,
      },
    }

    const saspayRes = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SASPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saspayPayload),
    })

    const saspayData = await saspayRes.json()
    const session = saspayData?.data || saspayData
    const checkoutUrl = session?.checkout_url
    const sessionId = session?.id

    if (saspayRes.ok && checkoutUrl) {
      await supabase
        .from('donations')
        .update({ payment_session_id: sessionId })
        .eq('id', donation.id)

      return new Response(
        JSON.stringify({
          checkout_url: checkoutUrl,
          donation_id: donation.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.error('SasPay checkout session creation failed:', saspayData)
    return new Response(
      JSON.stringify({
        error:
          saspayData?.error?.detail ||
          saspayData?.message ||
          'Erreur lors de l’initialisation de la session de paiement SasPay',
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
