import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  type Campaign,
  type Donation,
  type Payout,
  canUpdateWalletNumber,
} from '../types'
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
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from '../components/Icons'

interface DashboardPageProps {
  onNavigate: (path: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile, loading: authLoading } = useAuth()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'donations' | 'payouts'>('campaigns')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // État modal de retrait
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('')
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutSuccess, setPayoutSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/login')
    }
  }, [user, authLoading, onNavigate])

  const loadData = async () => {
    setLoading(true)

    try {
      let currentUserId = profile?.id

      if (!currentUserId && user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', user.id)
          .maybeSingle()
        if (prof) currentUserId = prof.id
      }

      if (currentUserId) {
        // 1. Collectes créées
        const { data: camps } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })

        setCampaigns(camps || [])

        // 2. Dons associés à ces collectes
        const campaignIds = (camps || []).map((c) => c.id)
        if (campaignIds.length > 0) {
          const { data: dons } = await supabase
            .from('donations')
            .select('*')
            .in('campaign_id', campaignIds)
            .order('created_at', { ascending: false })

          setDonations(dons || [])
        } else {
          setDonations([])
        }

        // 3. Demandes de retrait
        const { data: pays } = await supabase
          .from('payouts')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })

        setPayouts(pays || [])
      } else {
        // Chargement démo locale
        const localCampaigns = JSON.parse(localStorage.getItem('donkai_local_campaigns') || '[]')
        setCampaigns(localCampaigns)
      }
    } catch (err) {
      console.error('Erreur chargement données dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, profile])

  // Calculs financiers consolidés
  const totalRaisedNet = donations
    .filter((d) => d.status === 'paid')
    .reduce((acc, d) => acc + d.net_amount, 0)

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0)

  const pendingPayouts = payouts
    .filter((p) => p.status === 'requested' || p.status === 'processing' || p.status === 'under_review')
    .reduce((acc, p) => acc + p.amount, 0)

  const availableBalance = Math.max(0, totalRaisedNet - totalPaidOut - pendingPayouts)

  const totalDonorsCount = donations.filter((d) => d.status === 'paid').length
  const averageDonation = totalDonorsCount > 0 ? Math.round(totalRaisedNet / totalDonorsCount) : 0

  // Règle des 30 jours pour le numéro de retrait
  const walletUpdateStatus = canUpdateWalletNumber(profile?.wallet_last_updated_at || null)

  // Seuil KYC 500 000 FCFA
  const isKycRequired = totalRaisedNet >= 500000 && profile?.verification_status !== 'verified'

  const handleCopyLink = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedLink(path)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutError(null)

    const numAmount = Number(payoutAmount)
    if (!numAmount || numAmount < 5000) {
      setPayoutError('Le montant minimal pour demander un retrait est de 5 000 FCFA.')
      return
    }

    if (numAmount > availableBalance) {
      setPayoutError('Le montant demandé dépasse votre solde disponible.')
      return
    }

    if (!profile?.wallet_number) {
      setPayoutError('Veuillez configurer votre numéro de versement Mobile Money dans vos paramètres.')
      return
    }

    setPayoutSubmitting(true)

    try {
      const { error: insertError } = await supabase.from('payouts').insert({
        user_id: profile.id,
        amount: numAmount,
        wallet_provider: profile.wallet_provider || 'orange',
        wallet_number: profile.wallet_number,
        status: totalRaisedNet >= 500000 ? 'under_review' : 'requested',
      })

      if (insertError) {
        // Enregistrement local de secours
        const localPayouts = JSON.parse(localStorage.getItem('donkai_local_payouts') || '[]')
        localPayouts.unshift({
          id: `payout_${Date.now()}`,
          amount: numAmount,
          wallet_provider: profile.wallet_provider || 'orange',
          wallet_number: profile.wallet_number,
          status: 'requested',
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('donkai_local_payouts', JSON.stringify(localPayouts))
      }

      setPayoutSuccess(true)
      setPayoutAmount('')
      await loadData()
      setTimeout(() => {
        setPayoutModalOpen(false)
        setPayoutSuccess(false)
      }, 2000)
    } catch (err) {
      setPayoutError((err as Error).message || 'Erreur lors de la demande de versement.')
    } finally {
      setPayoutSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      {/* En-tête Organisateur */}
      <div className="bg-white rounded-3xl border border-orange-100/80 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
              Tableau de bord
            </h1>
            {profile?.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Vérifié</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Compte de réception :{' '}
            <strong className="text-gray-800 uppercase font-bold">
              {profile?.wallet_provider || 'Orange'} ({profile?.wallet_number || 'Non configuré'})
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/create')}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle collecte</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/settings')}
            className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          >
            <span>Paramètres</span>
          </button>
        </div>
      </div>

      {/* Alerte de sécurité verrouillage 30 jours (Section 19 du master prompt) */}
      {!walletUpdateStatus.allowed && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Protection anti-fraude active</p>
            <p className="mt-0.5">
              Les informations de réception ont récemment été modifiées. Par mesure de protection pour vos collectes, le numéro ne peut plus être modifié pendant encore {walletUpdateStatus.daysRemaining} jour(s).
            </p>
          </div>
        </div>
      )}

      {/* Alerte KYC seuil 500 000 FCFA (Section 20 du master prompt) */}
      {isKycRequired && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Vérification d’identité recommandée (Palier 500 000 FCFA)</p>
              <p className="mt-0.5">
                Vos collectes ont franchi le palier de 500 000 FCFA. Pour garantir la fluidité des versements importants, finalisez votre vérification d’identité.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/settings')}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer"
          >
            Vérifier
          </button>
        </div>
      )}

      {/* Cartes métriques financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde disponible */}
        <div className="bg-white p-6 rounded-3xl border border-orange-100/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Solde disponible</span>
            <Coins className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-950">
            {availableBalance.toLocaleString()} FCFA
          </p>
          <button
            type="button"
            onClick={() => {
              setPayoutAmount(availableBalance >= 5000 ? availableBalance : '')
              setPayoutModalOpen(true)
            }}
            disabled={availableBalance < 5000}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Demander un retrait</span>
          </button>
        </div>

        {/* Total collecté net */}
        <div className="bg-white p-6 rounded-3xl border border-orange-100/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Total collecté (net)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-emerald-600">
            {totalRaisedNet.toLocaleString()} FCFA
          </p>
          <p className="text-[11px] text-gray-400">
            Après déduction des frais (5% + 100 FCFA)
          </p>
        </div>

        {/* Déjà retiré */}
        <div className="bg-white p-6 rounded-3xl border border-orange-100/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Déjà retiré</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-950">
            {totalPaidOut.toLocaleString()} FCFA
          </p>
          {pendingPayouts > 0 ? (
            <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{pendingPayouts.toLocaleString()} FCFA en traitement</span>
            </p>
          ) : (
            <p className="text-[11px] text-gray-400">Versements Mobile Money validés</p>
          )}
        </div>

        {/* Soutiens & Moyenne */}
        <div className="bg-white p-6 rounded-3xl border border-orange-100/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Contributions</span>
            <Users className="w-4 h-4 text-gray-700" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-950">
            {totalDonorsCount}
          </p>
          <p className="text-[11px] text-gray-400">
            Moyenne : {averageDonation.toLocaleString()} FCFA / don
          </p>
        </div>
      </div>

      {/* Onglets : Collectes / Dons reçus / Historique Retraits */}
      <div className="bg-white rounded-3xl border border-orange-100/80 shadow-xs overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mes collectes ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'donations'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Contributions reçues ({donations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Historique des retraits ({payouts.length})
          </button>
        </div>

        <div className="p-6">
          {/* Onglet 1 : Mes collectes */}
          {activeTab === 'campaigns' && (
            <div>
              {campaigns.length === 0 ? (
                <div className="text-center py-12 space-y-3 text-gray-400">
                  <p className="text-sm font-medium">Vous n'avez encore créé aucune collecte.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('/create')}
                    className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer ma première collecte</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {campaigns.map((c) => {
                    const pct = Math.min(100, Math.round((c.collected_amount / c.goal_amount) * 100))
                    const campaignUrl = `/@${profile?.username || 'user'}/${c.slug}`

                    return (
                      <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="space-y-1.5 max-w-md">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-gray-900">
                              {c.title}
                            </h4>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              {c.status === 'active' ? 'Active' : c.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>
                              <strong className="text-gray-800">{c.collected_amount.toLocaleString()} FCFA</strong> / {c.goal_amount.toLocaleString()} FCFA ({pct}%)
                            </span>
                            <span>•</span>
                            <span>{c.contributions_count} soutiens</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(campaignUrl)}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedLink === campaignUrl ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedLink === campaignUrl ? 'Copié' : 'Copier lien'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigate(campaignUrl)}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Voir</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Onglet 2 : Contributions reçues */}
          {activeTab === 'donations' && (
            <div>
              {donations.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Aucune contribution reçue pour le moment. Partagez votre lien de collecte.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {donations.map((d) => (
                    <div key={d.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">
                            {d.is_anonymous ? 'Contributeur anonyme' : (d.donor_name || 'Anonyme')}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            {d.status === 'paid' ? 'Validé' : d.status}
                          </span>
                        </div>
                        {d.message && <p className="text-gray-600 italic">"{d.message}"</p>}
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
                        <p className="text-sm font-extrabold text-emerald-600">
                          +{d.net_amount.toLocaleString()} FCFA net
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Brut : {d.amount.toLocaleString()} FCFA (Frais : {d.fee.toLocaleString()} FCFA)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet 3 : Retraits */}
          {activeTab === 'payouts' && (
            <div>
              {payouts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Aucun versement demandé. Dès 5 000 FCFA disponibles, vous pouvez déclencher un retrait.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payouts.map((p) => (
                    <div key={p.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">
                            Vers {p.wallet_provider.toUpperCase()} ({p.wallet_number})
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {p.status === 'completed' ? 'Effectué' : p.status === 'under_review' ? 'En revue de conformité' : 'En cours'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Demandé le {new Date(p.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <p className="text-sm font-extrabold text-gray-950">
                        {p.amount.toLocaleString()} FCFA
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Demande de Retrait */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <h3 className="text-lg font-extrabold text-gray-950 mb-1.5">Demande de retrait</h3>
            <p className="text-xs text-gray-500 mb-6">
              Les fonds seront versés sur votre compte{' '}
              <strong className="text-gray-900 uppercase">
                {profile?.wallet_provider} ({profile?.wallet_number})
              </strong>
              . Aucun frais supplémentaire n'est appliqué au retrait.
            </p>

            {payoutSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CircleCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900">Demande de versement validée !</p>
                <p className="text-xs text-gray-500">
                  Les fonds seront crédités directement sur votre numéro Mobile Money.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Montant à retirer (FCFA)
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
                    Solde disponible : {availableBalance.toLocaleString()} FCFA (Min. 5 000 FCFA)
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
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {payoutSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmer</span>}
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
