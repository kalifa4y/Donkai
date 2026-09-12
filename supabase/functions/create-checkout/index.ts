// Supabase Edge Function — create-checkout (SasPay Integration)
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
    const { creator_id, amount, donor_name, donor_email, message, return_url } = await req.json()

    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount < 100) {
      return new Response(
        JSON.stringify({ error: 'Le montant minimum est de 100 XOF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!creator_id) {
      return new Response(
        JSON.stringify({ error: 'creator_id manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Verifier le createur
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, username, display_name')
      .eq('id', creator_id)
      .single()

    if (creatorError || !creator) {
      return new Response(
        JSON.stringify({ error: 'Créateur introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const fee = Math.round(parsedAmount * 0.05)
    const netAmount = parsedAmount - fee

    // 2. Creer l'enregistrement de don
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        creator_id: creator.id,
        amount: parsedAmount,
        fee,
        net_amount: netAmount,
        currency: 'XOF',
        donor_name: donor_name || null,
        donor_email: donor_email || null,
        message: message || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (donationError || !donation) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement du don" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Creer la session de checkout chez SasPay
    const saspayPayload = {
      amount: `${parsedAmount}.00`,
      currency: 'XOF',
      description: `Soutien pour ${creator.display_name || creator.username}`,
      customer_name: donor_name || 'Anonyme',
      customer_email: donor_email || 'donateur@donka.app',
      return_url: return_url || '',
      metadata: {
        donation_id: donation.id,
        creator_id: creator.id,
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

    if (!saspayRes.ok || !saspayData.checkout_url) {
      await supabase.from('donations').update({ status: 'failed' }).eq('id', donation.id)
      return new Response(
        JSON.stringify({
          error: saspayData?.error?.message || 'Erreur lors de la création de la session SasPay',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Associer la session SasPay au don
    await supabase
      .from('donations')
      .update({ saspay_session_id: saspayData.id })
      .eq('id', donation.id)

    return new Response(
      JSON.stringify({
        checkout_url: saspayData.checkout_url,
        donation_id: donation.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
