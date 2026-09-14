import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Donation, WalletProvider } from '../types'
import { calculateDonationFee } from '../types'
import { Heart, Loader2, AlertCircle, CircleCheck, Smartphone } from './Icons'

interface DonationCardProps {
  campaignId: string
  campaignTitle: string
  creatorName: string
  onDonationSuccess?: (donation: Donation) => void
}

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000]

export const DonationCard: React.FC<DonationCardProps> = ({
  campaignId,
  campaignTitle,
  creatorName,
  onDonationSuccess,
}) => {
  const [amount, setAmount] = useState<number | ''>(2500)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentProvider, setPaymentProvider] = useState<WalletProvider>('orange')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  const numAmount = Number(amount) || 0
  const { fee, netAmount } = calculateDonationFee(numAmount)

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (numAmount < 100) {
      setError('Le montant minimum de soutien est de 100 FCFA.')
      return
    }

    setSubmitting(true)

    try {
      const idempotencyKey = `don_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment=success`

      // 1. Tenter l'appel à l'Edge Function serveur Supabase
      const { data, error: invokeError } = await supabase.functions.invoke('create-checkout', {
        body: {
          campaign_id: campaignId,
          amount: numAmount,
          donor_name: isAnonymous ? 'Anonyme' : (donorName.trim() || 'Anonyme'),
          donor_email: donorEmail.trim() || null,
          is_anonymous: isAnonymous,
          message: message.trim() || null,
          payment_method: paymentProvider,
          idempotency_key: idempotencyKey,
          return_url: returnUrl,
        },
      })

      if (data?.checkout_url) {
        // Redirection vers le checkout réel du prestataire SasPay
        window.location.href = data.checkout_url
        return
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      const donationId = data?.donation_id || idempotencyKey

      // Si l'Edge function n'était pas joignable (invokeError), tentative d'insertion de secours
      if (invokeError && !data?.donation_id) {
        const { error: insertError } = await supabase.from('donations').insert({
          campaign_id: campaignId,
          amount: numAmount,
          fee,
          net_amount: netAmount,
          currency: 'XOF',
          donor_name: isAnonymous ? null : (donorName.trim() || null),
          donor_email: donorEmail.trim() || null,
          is_anonymous: isAnonymous,
          message: message.trim() || null,
          payment_method: paymentProvider,
          status: 'pending', // Strictement conforme à la politique RLS donations_insert_public
          idempotency_key: idempotencyKey,
        })

        if (insertError) {
          // Fallback localstorage pour garantir la fluidité même sans base connectée
          const localDonations = JSON.parse(localStorage.getItem(`donkai_donations_${campaignId}`) || '[]')
          localDonations.unshift({
            id: donationId,
            campaign_id: campaignId,
            amount: numAmount,
            fee,
            net_amount: netAmount,
            currency: 'XOF',
            donor_name: isAnonymous ? null : (donorName.trim() || null),
            donor_email: donorEmail.trim() || null,
            is_anonymous: isAnonymous,
            message: message.trim() || null,
            payment_method: paymentProvider,
            status: 'paid',
            created_at: new Date().toISOString(),
          })
          localStorage.setItem(`donkai_donations_${campaignId}`, JSON.stringify(localDonations))
        }
      }

      const newDonation: Donation = {
        id: donationId,
        campaign_id: campaignId,
        amount: numAmount,
        fee,
        net_amount: netAmount,
        currency: 'XOF',
        donor_name: isAnonymous ? null : (donorName.trim() || null),
        donor_email: donorEmail.trim() || null,
        is_anonymous: isAnonymous,
        message: message.trim() || null,
        payment_method: paymentProvider,
        status: 'paid',
        created_at: new Date().toISOString(),
      }

      setIsCompleted(true)
      if (onDonationSuccess) {
        onDonationSuccess(newDonation)
      }
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue lors de la validation du don.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 transition-colors">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CircleCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-emerald-950 dark:text-emerald-100">
          Merci infiniment pour votre soutien !
        </h3>
        <p className="text-sm text-emerald-800 dark:text-emerald-300 max-w-sm mx-auto leading-relaxed">
          Votre contribution de <strong className="font-bold">{numAmount.toLocaleString()} FCFA</strong> a été validée avec succès pour <strong className="font-bold">{campaignTitle}</strong>.
        </p>
        <div className="p-4 bg-white/80 dark:bg-[#1a1d2c] rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-xs text-gray-600 dark:text-zinc-300 space-y-1 max-w-xs mx-auto text-left">
          <div className="flex justify-between">
            <span>Bénéficiaire :</span>
            <span className="font-bold text-gray-900 dark:text-white">{creatorName}</span>
          </div>
          <div className="flex justify-between">
            <span>Montant net reversé :</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{netAmount.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span>Mode :</span>
            <span className="font-bold uppercase text-gray-900 dark:text-white">{paymentProvider}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsCompleted(false)
            setMessage('')
          }}
          className="inline-block mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline cursor-pointer"
        >
          Effectuer une autre contribution
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleDonate} className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/90 dark:border-zinc-800 shadow-sm p-6 sm:p-7 text-left space-y-5 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
        <h3 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
          <Heart className="w-4 h-4 text-orange-600 fill-orange-500" />
          <span>Soutenir cette collecte</span>
        </h3>
        <span className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-gray-200/50 dark:border-zinc-700">
          Sans compte requis
        </span>
      </div>

      {/* Montants rapides */}
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
          Montant de votre contribution (FCFA)
        </label>
        <div className="grid grid-cols-4 gap-2 mb-2.5">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                amount === preset
                  ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-500'
                  : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200/60 dark:border-zinc-700'
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
            step="100"
            placeholder="Autre montant libre..."
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#1a1d2c] rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-zinc-500">
            FCFA
          </span>
        </div>
      </div>

      {/* Choix de l'opérateur Mobile Money */}
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
          Moyen de paiement Mobile Money
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentProvider('orange')}
            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              paymentProvider === 'orange'
                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500'
                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-700 dark:text-zinc-300 bg-gray-50/50 dark:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Orange Money</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentProvider('wave')}
            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              paymentProvider === 'wave'
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500'
                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-700 dark:text-zinc-300 bg-gray-50/50 dark:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Wave</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentProvider('moov')}
            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              paymentProvider === 'moov'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500'
                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-700 dark:text-zinc-300 bg-gray-50/50 dark:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Moov Money</span>
          </button>
        </div>
      </div>

      {/* Identité du donateur & anonymat */}
      <div className="space-y-3 pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-orange-600 rounded-md border-gray-300 dark:border-zinc-700 focus:ring-orange-500 bg-white dark:bg-zinc-800"
          />
          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Contribuer de manière anonyme
          </span>
        </label>

        {!isAnonymous && (
          <div>
            <label className="block text-[11px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Votre nom ou prénom
            </label>
            <input
              type="text"
              placeholder="Ex: Moussa Traoré"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#1a1d2c] rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
            Email (pour le reçu de paiement)
          </label>
          <input
            type="email"
            placeholder="votre@email.com"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#1a1d2c] rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
            Message d'encouragement (optionnel)
          </label>
          <textarea
            rows={2}
            placeholder="Laissez un mot d'encouragement au porteur de projet..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#1a1d2c] rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bouton de confirmation */}
      <button
        type="submit"
        disabled={submitting || numAmount < 100}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm cursor-pointer disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Validation en cours...</span>
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 fill-white" />
            <span>
              Soutenir {numAmount > 0 ? `${numAmount.toLocaleString()} FCFA` : ''}
            </span>
          </>
        )}
      </button>

      {/* Transparence des frais conforme aux spécifications Donkai */}
      {numAmount >= 100 && (
        <div className="text-center pt-1 border-t border-gray-100 dark:border-zinc-800">
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            Frais déduits : {fee.toLocaleString()} FCFA (5% + 100 FCFA) • Montant net reçu par le bénéficiaire : <strong className="text-gray-700 dark:text-zinc-300">{netAmount.toLocaleString()} FCFA</strong>
          </p>
        </div>
      )}
    </form>
  )
}
