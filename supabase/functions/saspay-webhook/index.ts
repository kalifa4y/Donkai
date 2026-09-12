// Supabase Edge Function — saspay-webhook (HMAC verified)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SASPAY_WEBHOOK_SECRET = Deno.env.get('SASPAY_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const TOLERANCE_SECONDS = 300

async function verifySignature(
  rawBody: string,
  signatureHeader: string,
  timestampHeader: string,
  secret: string
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  const timestamp = Number(timestampHeader)

  // Rejet si le timestamp differe de plus de 5 minutes
  if (isNaN(timestamp) || Math.abs(now - timestamp) > TOLERANCE_SECONDS) {
    return false
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const toSign = `${timestampHeader}.${rawBody}`
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign))
  const expectedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return expectedHex === signatureHeader.toLowerCase()
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-webhook-signature') || ''
    const timestamp = req.headers.get('x-webhook-timestamp') || ''
    const eventType = req.headers.get('x-webhook-event') || ''

    // Verifier la signature cryptographique si le secret est renseigne
    if (SASPAY_WEBHOOK_SECRET) {
      const isValid = await verifySignature(rawBody, signature, timestamp, SASPAY_WEBHOOK_SECRET)
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Signature ou timestamp invalide' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event || eventType
    const data = payload.data || {}

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const donationId = data?.metadata?.donation_id
    const transactionId = data?.id

    if (event === 'transaction.success') {
      let query = supabase.from('donations').update({
        status: 'paid',
        saspay_transaction_id: transactionId || null,
      })

      if (donationId) {
        query = query.eq('id', donationId)
      } else if (transactionId) {
        query = query.eq('saspay_transaction_id', transactionId)
      }

      await query
    } else if (event === 'transaction.failed' || event === 'transaction.cancelled') {
      let query = supabase.from('donations').update({
        status: 'failed',
      })

      if (donationId) {
        query = query.eq('id', donationId)
      } else if (transactionId) {
        query = query.eq('saspay_transaction_id', transactionId)
      }

      await query
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || 'Erreur webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
