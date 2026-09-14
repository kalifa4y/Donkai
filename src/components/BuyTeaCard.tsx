import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Donation, WalletProvider } from '../types'
import { Coffee, Loader2, AlertCircle, Sparkles, Check } from './Icons'

interface BuyTeaCardProps {
  creatorId: string
  creatorUsername: string
  creatorDisplayName: string
  targetCampaignId?: string | null
  onTeaBought?: (donation: Donation) => void
}

interface TeaTier {
  count: number | 'dibi'
  amount: number
  label: string
  sublabel: string
}

const TEA_TIERS: TeaTier[] = [
  { count: 1, amount: 500, label: '1 Thé', sublabel: 'Encouragement' },
  { count: 3, amount: 1500, label: '3 Thés', sublabel: 'Le Grin complet' },
  { count: 'dibi', amount: 5000, label: 'Un Dibi', sublabel: 'Grand geste' },
]

export const BuyTeaCard: React.FC<BuyTeaCardProps> = ({
  creatorId,
  creatorUsername,
  creatorDisplayName,
  targetCampaignId,
  onTeaBought,
}) => {
  const [selectedTier, setSelectedTier] = useState<number | 'dibi' | 'custom'>(3)
  const [amount, setAmount] = useState<number>(1500)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [donorName, setDonorName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentProvider, setPaymentProvider] = useState<WalletProvider>('orange')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSelectTier = (tier: TeaTier) => {
    setSelectedTier(tier.count)
    setAmount(tier.amount)
    setCustomAmount('')
  }

  const handleSelectCustom = () => {
    setSelectedTier('custom')
    setAmount(Number(customAmount) || 1000)
  }

  const handleCustomChange = (val: string) => {
    setCustomAmount(val)
    const num = Number(val)
    if (num > 0) {
      setAmount(num)
    }
  }

  const formatFcfa = (val: number): string => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (amount < 100) {
      setError('Le montant minimum pour offrir un thé est de 100 FCFA.')
      return
    }

    setSubmitting(true)

    try {
      const idempotencyKey = `tea_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const returnUrl = `${window.location.origin}${window.location.pathname}?tea=success`
      const finalDonorName = isAnonymous ? 'Contributeur anonyme' : donorName.trim() || 'Un fan'

      // Campagne cible ou ID virtuel
      const campaignIdToUse = targetCampaignId || `creator-tips-${creatorId}`

      // Appel Edge Function Supabase ou fallback transparent
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('create-checkout', {
          body: {
            campaign_id: campaignIdToUse,
            amount,
            donor_name: finalDonorName,
            donor_email: null,
            is_anonymous: isAnonymous,
            message: message.trim() || null,
            payment_method: paymentProvider,
            idempotency_key: idempotencyKey,
            return_url: returnUrl,
          },
        })

        if (!invokeError && data?.checkout_url) {
          window.location.href = data.checkout_url
          return
        }
      } catch {
        // Fallback local direct
      }

      // Enregistrement local du thé pour feedback immédiat
      const newTeaDonation: Donation = {
        id: `tea-${Date.now()}`,
        campaign_id: campaignIdToUse,
        amount,
        fee: Math.round(amount * 0.05),
        net_amount: Math.round(amount * 0.95),
        currency: 'XOF',
        donor_name: isAnonymous ? null : finalDonorName,
        donor_email: null,
        is_anonymous: isAnonymous,
        message: message.trim() || null,
        status: 'paid',
        created_at: new Date().toISOString(),
      }

      const storedTeas = JSON.parse(
        localStorage.getItem(`donkai_teas_${creatorId}`) || '[]'
      )
      localStorage.setItem(
        `donkai_teas_${creatorId}`,
        JSON.stringify([newTeaDonation, ...storedTeas])
      )

      if (onTeaBought) {
        onTeaBought(newTeaDonation)
      }

      setSuccess(true)
      setMessage('')
    } catch (err) {
      setError((err as Error).message || 'Impossible d’initialiser le paiement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-emerald-200 dark:border-emerald-800/80 shadow-xl p-6 sm:p-7 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
          <Check className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
            Merci pour votre générosité !
          </h3>
          <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
            Votre thé a bien été offert à <strong className="text-gray-900 dark:text-white">{creatorDisplayName}</strong>. Votre message sera affiché fièrement sur son profil.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer pt-2"
        >
          Offrir un autre thé
        </button>
      </div>
    )
  }

  return (
    <div
      id="buy-tea-section"
      className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xl shadow-orange-950/5 p-6 sm:p-7 transition-all text-left"
    >
      {/* En-tête ludique & chaleureux */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800/80 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
          <Coffee className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-extrabold text-base text-gray-950 dark:text-white flex items-center gap-1.5 flex-wrap">
            <span>Offrir un Thé à</span>
            <span className="text-orange-600 dark:text-orange-400 font-mono">@{creatorUsername}</span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400">
            Soutenez son travail, ses vidéos ou ses créations
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1 font-medium leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Choix du nombre de thés */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
            Choisissez votre geste
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TEA_TIERS.map((tier) => {
              const isSelected = selectedTier === tier.count
              return (
                <button
                  key={String(tier.count)}
                  type="button"
                  onClick={() => handleSelectTier(tier)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-center flex flex-col justify-between ${
                    isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-sm shadow-orange-600/30 ring-2 ring-orange-500/20'
                      : 'bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 hover:border-orange-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Coffee className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`} />
                    <span className="font-extrabold text-xs">{tier.label}</span>
                  </div>
                  <div className="font-extrabold text-[11px]">
                    {formatFcfa(tier.amount)} <span className="text-[9px] font-normal opacity-90">F</span>
                  </div>
                  <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500'}`}>
                    {tier.sublabel}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bouton pour montant personnalisé */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectCustom}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedTier === 'custom'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-gray-50 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
            }`}
          >
            Autre montant libre
          </button>

          {selectedTier === 'custom' && (
            <div className="relative flex-1">
              <input
                type="number"
                min="100"
                step="100"
                required
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="Montant FCFA..."
                className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl py-1.5 pl-3 pr-12 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">
                FCFA
              </span>
            </div>
          )}
        </div>

        {/* Nom & Message */}
        <div className="space-y-3 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                Votre nom ou pseudo
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span>Anonyme</span>
              </label>
            </div>
            {!isAnonymous && (
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Ex: Fanta, Mamadou, un supporter de Bamako..."
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Un mot d'encouragement (public)
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Bravo pour tes vidéos, continue comme ça ! On est ensemble."
              className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Opérateur de paiement */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
            Payer avec Mobile Money
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentProvider('orange')}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                paymentProvider === 'orange'
                  ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 shadow-xs'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40'
              }`}
            >
              <img src="/icons/orange-money.svg" alt="Orange" className="h-5 w-auto object-contain mb-1" />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white">Orange</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentProvider('wave')}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                paymentProvider === 'wave'
                  ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-xs'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40'
              }`}
            >
              <img src="/icons/wave.png" alt="Wave" className="h-5 w-auto object-contain mb-1" />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white">Wave</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentProvider('moov')}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                paymentProvider === 'moov'
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40'
              }`}
            >
              <img src="/icons/moov-money.png" alt="Moov" className="h-5 w-auto object-contain mb-1" />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white">Moov</span>
            </button>
          </div>
        </div>

        {/* Bouton de confirmation */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-heading font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Coffee className="w-4 h-4" />
                <span>
                  Offrir {selectedTier === 'custom' ? `${formatFcfa(amount)} F` : selectedTier === 'dibi' ? 'un Dibi' : `${selectedTier} Thé${typeof selectedTier === 'number' && selectedTier > 1 ? 's' : ''}`} ({formatFcfa(amount)} FCFA)
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500 pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>Directement reçu par le créateur</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              0 FCFA de frais donateur
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}
