import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Donation, WalletProvider } from '../types'
import { Heart, Loader2, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from './Icons'

interface DonationCardProps {
  campaignId: string
  campaignTitle: string
  creatorName: string
  onDonationSuccess?: (donation: Donation) => void
}

interface PresetImpact {
  amount: number
  impact: string
}

const PRESET_AMOUNTS: PresetImpact[] = [
  { amount: 1000, impact: 'Soutien symbolique' },
  { amount: 2500, impact: '1 kit repas / fournitures' },
  { amount: 5000, impact: '1 sac de ciment / matériel' },
  { amount: 25000, impact: 'Impact direct & décisif' },
]

export const DonationCard: React.FC<DonationCardProps> = ({
  campaignId,
  campaignTitle,
  creatorName,
}) => {
  // Wizard étape (1: Montant & Opérateur, 2: Donateur & Validation)
  const [step, setStep] = useState<1 | 2>(1)

  const [amount, setAmount] = useState<number | ''>(2500)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentProvider, setPaymentProvider] = useState<WalletProvider>('orange')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numAmount = Number(amount) || 0

  const formatFcfa = (val: number): string => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (numAmount < 100) {
      setError('Le montant minimum de soutien est de 100 FCFA.')
      return
    }
    setStep(2)
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (numAmount < 100) {
      setError('Le montant minimum de soutien est de 100 FCFA.')
      setStep(1)
      return
    }

    setSubmitting(true)

    try {
      const idempotencyKey = `don_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment=success`

      // Appel strict et direct à l'Edge Function serveur Supabase
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

      if (invokeError) {
        throw new Error(invokeError.message || 'Impossible de joindre le serveur de paiement.')
      }

      if (data?.checkout_url) {
        // Redirection immédiate vers le checkout sécurisé officiel SasPay
        window.location.href = data.checkout_url
        return
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      throw new Error("La session de paiement n'a pas pu être initialisée par l'opérateur. Veuillez réessayer.")
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue lors de la validation du don.')
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#12131a] rounded-3xl p-6 sm:p-7 border border-gray-100 dark:border-zinc-800/80 shadow-xl shadow-orange-950/5 transition-all">
      {/* En-tête de la carte avec étapes wizard */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800/70 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-gray-950 dark:text-white leading-none">
              Soutenir cette collecte
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
              Sans création de compte requise
            </p>
          </div>
        </div>

        {/* Indicateur Wizard */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full transition-all ${
              step === 1 ? 'bg-orange-600 w-5' : 'bg-gray-200 dark:bg-zinc-700'
            }`}
          />
          <span
            className={`w-2 h-2 rounded-full transition-all ${
              step === 2 ? 'bg-orange-600 w-5' : 'bg-gray-200 dark:bg-zinc-700'
            }`}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1 font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* ÉTAPE 1 : MONTANT & CHOIX DE L'OPÉRATEUR */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="space-y-5">
          {/* Montants prédéfinis avec paliers d'impact tangibles */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
              Choisissez votre montant & palier d’impact
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((p) => {
                const isSelected = numAmount === p.amount
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => setAmount(p.amount)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-orange-600 border-orange-600 text-white shadow-sm shadow-orange-600/30 ring-2 ring-orange-500/20'
                        : 'bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 hover:border-orange-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-extrabold text-xs">
                      {formatFcfa(p.amount)}{' '}
                      <span className="text-[10px] font-normal opacity-85">FCFA</span>
                    </div>
                    <div
                      className={`text-[10px] leading-tight mt-1 line-clamp-2 ${
                        isSelected ? 'text-orange-100 font-medium' : 'text-gray-500 dark:text-zinc-400'
                      }`}
                    >
                      {p.impact}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Saisie montant libre */}
          <div>
            <div className="relative">
              <input
                type="number"
                min="100"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Autre montant libre..."
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-3 pl-4 pr-16 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600 transition-all"
              />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-zinc-500 pointer-events-none">
                FCFA
              </span>
            </div>
            {numAmount >= 100 && (
              <p className="mt-1.5 text-[11px] text-gray-500 dark:text-zinc-400 flex items-center justify-between">
                <span>
                  {PRESET_AMOUNTS.find((p) => p.amount === numAmount)?.impact
                    ? `Palier : ${PRESET_AMOUNTS.find((p) => p.amount === numAmount)?.impact}`
                    : '100% reversé au projet'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  0 FCFA de frais donateur
                </span>
              </p>
            )}
          </div>

          {/* Choix de l'opérateur avec VRAIS logos officiels */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
              Opérateur de paiement Mobile Money
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Orange Money */}
              <button
                type="button"
                onClick={() => setPaymentProvider('orange')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentProvider === 'orange'
                    ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 shadow-xs'
                    : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="h-8 flex items-center justify-center mb-1.5">
                  <img
                    src="/icons/orange-money.svg"
                    alt="Orange Money"
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-900 dark:text-white">Orange</span>
              </button>

              {/* Wave */}
              <button
                type="button"
                onClick={() => setPaymentProvider('wave')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentProvider === 'wave'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-xs'
                    : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="h-8 flex items-center justify-center mb-1.5">
                  <img
                    src="/icons/wave.png"
                    alt="Wave Mobile Money"
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-900 dark:text-white">Wave</span>
              </button>

              {/* Moov Money */}
              <button
                type="button"
                onClick={() => setPaymentProvider('moov')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentProvider === 'moov'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                    : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="h-8 flex items-center justify-center mb-1.5">
                  <img
                    src="/icons/moov-money.png"
                    alt="Moov Money"
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-900 dark:text-white">Moov</span>
              </button>
            </div>
          </div>


          <button
            type="submit"
            disabled={numAmount < 100}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-heading font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continuer ({formatFcfa(numAmount)} FCFA)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ÉTAPE 2 : INFORMATIONS DONATEUR & REDIRECTION SASPAY */}
      {step === 2 && (
        <form onSubmit={handleDonate} className="space-y-4">
          <div className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Paiement de <span className="text-orange-600 dark:text-orange-400">{formatFcfa(numAmount)} FCFA</span> via {paymentProvider === 'orange' ? 'Orange Money' : paymentProvider === 'wave' ? 'Wave' : 'Moov Money'}
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Modifier
              </button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
              Soutien pour {creatorName} &bull; {campaignTitle}
            </p>
          </div>

          {/* Option Anonymat */}
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/60 dark:border-zinc-700/60 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded-md border-gray-300 focus:ring-orange-500"
            />
            <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
              Contribuer de manière anonyme
            </span>
          </label>

          {/* Nom du donateur */}
          {!isAnonymous && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                Votre nom ou prénom
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Ex: Moussa Traoré"
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-2.5 px-3.5 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600"
              />
            </div>
          )}

          {/* Email du donateur */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
              Email (pour le reçu de paiement officiel)
            </label>
            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-2.5 px-3.5 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600"
            />
          </div>

          {/* Message d'encouragement */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
              Message d'encouragement (optionnel)
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Laissez un mot d'encouragement au porteur de projet..."
              className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-2.5 px-3.5 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600 resize-none"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-heading font-bold py-3.5 px-5 rounded-2xl transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirection vers la passerelle...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Payer {formatFcfa(numAmount)} FCFA</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
