// Supabase Edge Function — saspay-webhook (HMAC verified & Idempotence)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SASPAY_WEBHOOK_SECRET = Deno.env.get('SASPAY_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const TOLERANCE_SECONDS = 600

async function verifySignature(
  rawBody: string,
  reqHeaders: Headers,
  secret: string
): Promise<boolean> {
  const rawSigHeader =
    reqHeaders.get('x-webhook-signature') ||
    reqHeaders.get('x-saspay-signature') ||
    reqHeaders.get('saspay-signature') ||
    reqHeaders.get('stripe-signature') ||
    reqHeaders.get('x-signature') ||
    reqHeaders.get('signature') ||
    ''

  const rawTimestampHeader =
    reqHeaders.get('x-webhook-timestamp') ||
    reqHeaders.get('x-saspay-timestamp') ||
    reqHeaders.get('saspay-timestamp') ||
    reqHeaders.get('x-timestamp') ||
    ''

  if (!rawSigHeader) {
    return false
  }

  let sig = rawSigHeader.trim()
  let ts = rawTimestampHeader.trim()

  // Format Stripe (ex: t=1680000000,v1=abcdef...)
  if (sig.includes('t=') || sig.includes('v1=')) {
    const parts = sig.split(',')
    for (const part of parts) {
      const p = part.trim()
      if (p.startsWith('t=')) ts = p.slice(2)
      if (p.startsWith('v1=')) sig = p.slice(3)
    }
  }

  // Vérification de la dérive d'horodatage si présent
  if (ts) {
    const now = Math.floor(Date.now() / 1000)
    const timestamp = Number(ts)
    if (!isNaN(timestamp) && Math.abs(now - timestamp) > TOLERANCE_SECONDS) {
      console.warn('SasPay Webhook: horodatage expiré ou écart supérieur à la tolérance', {
        now,
        timestamp,
        diff: Math.abs(now - timestamp),
      })
    }
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Tester les deux formats courants d'empreinte HMAC-SHA256
  const candidates: string[] = []
  if (ts) {
    candidates.push(`${ts}.${rawBody}`)
  }
  candidates.push(rawBody)

  for (const candidate of candidates) {
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(candidate))
    const expectedHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (expectedHex.toLowerCase() === sig.toLowerCase()) {
      return true
    }
  }

  return false
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const rawBody = await req.text()

    // 1. Contrôle d'authenticité HMAC si le secret est configuré
    if (SASPAY_WEBHOOK_SECRET) {
      const isValid = await verifySignature(rawBody, req.headers, SASPAY_WEBHOOK_SECRET)
      if (!isValid) {
        console.error('SasPay Webhook signature mismatch')
        return new Response(JSON.stringify({ error: 'Signature webhook invalide' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const payload = JSON.parse(rawBody)
    const event = String(payload.event || payload.type || req.headers.get('x-webhook-event') || '').toLowerCase()
    const data = payload.data || payload

    const donationId = data?.metadata?.donation_id || payload?.metadata?.donation_id
    const transactionId = data?.transaction?.id || data?.transaction_id || data?.id || payload?.id
    const sessionId =
      data?.payment_session_id ||
      data?.checkout_session_id ||
      data?.session_id ||
      data?.id ||
      payload?.id

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 2. Recherche du don en base (par son UUID direct ou son ID de session SasPay)
    let donationQuery = supabase.from('donations').select('id, campaign_id, amount, net_amount, status, payment_session_id')
    if (donationId) {
      donationQuery = donationQuery.eq('id', donationId)
    } else if (sessionId) {
      donationQuery = donationQuery.eq('payment_session_id', sessionId)
    } else {
      console.warn('SasPay Webhook: Aucun identifiant de don ou session détecté dans le payload', payload)
      return new Response(JSON.stringify({ error: 'Identifiant introuvable dans le payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: donation, error: donationError } = await donationQuery.maybeSingle()

    if (donationError || !donation) {
      console.warn('SasPay Webhook: Don introuvable pour les identifiants fournis', { donationId, sessionId })
      return new Response(JSON.stringify({ received: true, warning: 'Don introuvable' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Identification du statut du paiement
    const isSuccess =
      event === 'transaction.success' ||
      event === 'checkout_session.completed' ||
      event === 'checkout.session.completed' ||
      event === 'payment.success' ||
      event === 'payment.succeeded' ||
      event.includes('success') ||
      event.includes('paid') ||
      String(data?.status || '').toLowerCase() === 'paid' ||
      String(data?.status || '').toLowerCase() === 'success' ||
      String(payload?.status || '').toLowerCase() === 'paid' ||
      String(payload?.status || '').toLowerCase() === 'success'

    const isFailure =
      event === 'transaction.failed' ||
      event === 'transaction.cancelled' ||
      event.includes('fail') ||
      event.includes('cancel') ||
      String(data?.status || '').toLowerCase() === 'failed' ||
      String(data?.status || '').toLowerCase() === 'cancelled'

    if (isSuccess) {
      // Protection d'idempotence : ne mettre à jour que si le don n'est pas déjà marqué payé
      if (donation.status !== 'paid') {
        await supabase
          .from('donations')
          .update({
            status: 'paid',
            payment_transaction_id: transactionId || null,
            paid_at: new Date().toISOString(),
          })
          .eq('id', donation.id)

        // Incrémenter le total collecté de la collecte
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('collected_amount, contributions_count')
          .eq('id', donation.campaign_id)
          .single()

        if (campaign) {
          const contributedAmount = donation.amount || donation.net_amount || 0
          await supabase
            .from('campaigns')
            .update({
              collected_amount: (campaign.collected_amount || 0) + contributedAmount,
              contributions_count: (campaign.contributions_count || 0) + 1,
            })
            .eq('id', donation.campaign_id)
        }
      }
    } else if (isFailure) {
      await supabase
        .from('donations')
        .update({
          status: 'failed',
          payment_transaction_id: transactionId || null,
        })
        .eq('id', donation.id)
    }

    return new Response(JSON.stringify({ received: true, donation_id: donation.id, status: isSuccess ? 'paid' : donation.status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('SasPay Webhook handler error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message || 'Erreur webhook interne' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
