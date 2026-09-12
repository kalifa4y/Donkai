import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Donation, Payout } from '../types'
import {
  Wallet,
  Copy,
  Check,
  TrendingUp,
  Coins,
  ArrowUpRight,
  Clock,
  CircleCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
} from '../components/Icons'

interface DashboardPageProps {
  onNavigate: (path: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, creator, loading: authLoading } = useAuth()
  const [donations, setDonations] = useState<Donation[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'donations' | 'payouts'>('donations')
  const [copied, setCopied] = useState(false)

  // Payout request modal state
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('')
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutSuccess, setPayoutSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/login')
    } else if (!authLoading && user && !creator) {
      onNavigate('/onboarding')
    }
  }, [user, creator, authLoading, onNavigate])

  const loadDashboardData = async () => {
    if (!creator) return
    setLoading(true)

    try {
      // 1. Dons payés
      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false })

      setDonations(donationsData || [])

      // 2. Demandes de retrait
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*')
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false })

      setPayouts(payoutsData || [])
    } catch (err) {
      console.error('Erreur chargement dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (creator) {
      loadDashboardData()
    }
  }, [creator])

  // Calculs financiers
  const totalEarned = donations
    .filter((d) => d.status === 'paid')
    .reduce((acc, d) => acc + d.net_amount, 0)

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0)

  const pendingPayouts = payouts
    .filter((p) => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0)

  const availableBalance = Math.max(0, totalEarned - totalPaidOut - pendingPayouts)

  const handleCopyLink = () => {
    if (!creator) return
    const url = `${window.location.origin}/@${creator.username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutError(null)

    if (!creator) return

    const amountNum = Number(payoutAmount)
    if (!amountNum || amountNum < 5000) {
      setPayoutError('Le montant minimum de retrait est de 5 000 XOF.')
      return
    }

    if (amountNum > availableBalance) {
      setPayoutError('Le montant demandé dépasse votre solde disponible.')
      return
    }

    setPayoutSubmitting(true)

    try {
      const { error: insertErr } = await supabase.from('payouts').insert({
        creator_id: creator.id,
        amount: amountNum,
        wallet_provider: creator.wallet_provider,
        wallet_number: creator.wallet_number,
        status: 'pending',
      })

      if (insertErr) throw insertErr

      setPayoutSuccess(true)
      setPayoutAmount('')
      await loadDashboardData()
      setTimeout(() => {
        setPayoutModalOpen(false)
        setPayoutSuccess(false)
      }, 2000)
    } catch (err) {
      setPayoutError((err as Error).message || "Erreur lors de la demande de retrait.")
    } finally {
      setPayoutSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!creator) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header avec lien public */}
      <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
              Bonjour, {creator.display_name}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Votre compte de versement :{' '}
            <strong className="text-gray-800 uppercase font-semibold">
              {creator.wallet_provider} ({creator.wallet_number})
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-mono text-xs text-gray-600 truncate max-w-[220px] sm:max-w-xs">
            donkai.app/@{creator.username}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate(`/@${creator.username}`)}
            title="Voir ma page publique"
            className="p-2.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cartes Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-orange-100/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Solde disponible</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-950 mb-4">
            {availableBalance.toLocaleString()}{' '}
            <span className="text-sm font-bold text-gray-400">XOF</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setPayoutAmount(availableBalance >= 5000 ? availableBalance : '')
              setPayoutModalOpen(true)
            }}
            disabled={availableBalance < 5000}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-orange-500/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {availableBalance >= 5000 ? 'Demander un retrait' : 'Minimum 5 000 XOF pour retrait'}
            </span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-orange-100/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total collecté (net)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mb-2">
            {totalEarned.toLocaleString()}{' '}
            <span className="text-sm font-bold text-gray-400">XOF</span>
          </p>
          <p className="text-xs text-gray-400">
            {donations.filter((d) => d.status === 'paid').length} don(s) encaissé(s) à 95%
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-orange-100/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Déjà versé</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-950 mb-2">
            {totalPaidOut.toLocaleString()}{' '}
            <span className="text-sm font-bold text-gray-400">XOF</span>
          </p>
          {pendingPayouts > 0 ? (
            <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{pendingPayouts.toLocaleString()} XOF en cours de versement</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400">Versements effectués sur votre compte</p>
          )}
        </div>
      </div>

      {/* Onglets Dons vs Retraits */}
      <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'donations'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Dons reçus ({donations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'payouts'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Demandes de retrait ({payouts.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'donations' ? (
            donations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm font-medium">Aucun don reçu pour le moment.</p>
                <p className="text-xs mt-1">Partagez votre lien public pour commencer à recevoir des soutiens.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <div key={d.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">
                          {d.donor_name || 'Anonyme'}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            d.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : d.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {d.status === 'paid' ? 'Payé' : d.status === 'pending' ? 'En attente' : 'Échoué'}
                        </span>
                      </div>
                      {d.message && (
                        <p className="text-xs text-gray-600 italic">"{d.message}"</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(d.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-extrabold text-emerald-600">
                        +{d.net_amount.toLocaleString()} XOF
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Brut: {d.amount.toLocaleString()} XOF (Frais: {d.fee.toLocaleString()} XOF)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm font-medium">Aucune demande de retrait effectuée.</p>
              <p className="text-xs mt-1">Dès que votre solde atteint 5 000 XOF, vous pouvez demander un versement.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {payouts.map((p) => (
                <div key={p.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">
                        Vers {p.wallet_provider.toUpperCase()} ({p.wallet_number})
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          p.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {p.status === 'completed' ? 'Effectué' : p.status === 'pending' ? 'En cours' : 'Échoué'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Demandé le{' '}
                      {new Date(p.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className="text-base font-extrabold text-gray-900">
                    {p.amount.toLocaleString()} XOF
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Demande de Retrait */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-6 sm:p-8 relative">
            <h3 className="text-lg font-extrabold text-gray-950 mb-2">Demander un retrait</h3>
            <p className="text-xs text-gray-500 mb-6">
              Les fonds seront versés sur votre compte{' '}
              <strong className="text-gray-900 uppercase">
                {creator.wallet_provider} ({creator.wallet_number})
              </strong>
              .
            </p>

            {payoutSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CircleCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900">Demande enregistrée !</p>
                <p className="text-xs text-gray-500">
                  Votre versement sera validé et envoyé sur votre Mobile Money sous peu.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Montant à retirer (XOF)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    max={availableBalance}
                    required
                    value={payoutAmount}
                    onChange={(e) =>
                      setPayoutAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Solde disponible : {availableBalance.toLocaleString()} XOF (Min. 5 000 XOF)
                  </p>
                </div>

                {payoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{payoutError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayoutModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {payoutSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Confirmer</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
