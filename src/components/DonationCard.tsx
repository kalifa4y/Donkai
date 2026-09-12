import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Heart, Loader2, AlertCircle } from './Icons'

interface DonationCardProps {
  creatorId: string
  creatorName: string
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000]

export const DonationCard: React.FC<DonationCardProps> = ({ creatorId, creatorName }) => {
  const [amount, setAmount] = useState<number | ''>(1000)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numAmount = Number(amount) || 0
  const netAmount = Math.max(0, Math.round(numAmount * 0.95))

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (numAmount < 100) {
      setError('Le montant minimum est de 100 XOF')
      return
    }

    setSubmitting(true)

    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment=success`
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          creator_id: creatorId,
          amount: numAmount,
          donor_name: donorName.trim() || 'Anonyme',
          donor_email: donorEmail.trim() || 'donateur@donka.app',
          message: message.trim() || null,
          return_url: returnUrl,
        },
      })

      if (fnError || !data?.checkout_url) {
        throw new Error(fnError?.message || data?.error || 'Impossible de démarrer la session de paiement.')
      }

      // Redirection immédiate vers le checkout sécurisé SasPay
      window.location.href = data.checkout_url
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue lors de la redirection.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleDonate} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Montant du don (XOF)
        </label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                amount === preset
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 ring-2 ring-orange-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number"
            min="100"
            step="50"
            placeholder="Autre montant..."
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
            XOF
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Votre nom ou pseudo (optionnel)
        </label>
        <input
          type="text"
          placeholder="Anonyme"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Adresse e-mail (reçu de paiement)
        </label>
        <input
          type="email"
          placeholder="votre@email.com"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Message de soutien (optionnel)
        </label>
        <textarea
          rows={2}
          placeholder="Un mot d'encouragement..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none transition-all"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || numAmount < 100}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/25 transition-all text-base cursor-pointer disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirection vers SasPay...</span>
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 fill-white" />
            <span>
              Soutenir {numAmount > 0 ? `${numAmount.toLocaleString()} XOF` : ''}
            </span>
          </>
        )}
      </button>

      {numAmount >= 100 && (
        <p className="text-center text-[11px] text-gray-400">
          {creatorName} recevra {netAmount.toLocaleString()} XOF (5% de frais de plateforme inclus)
        </p>
      )}
    </form>
  )
}
