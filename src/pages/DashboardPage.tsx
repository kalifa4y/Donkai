import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  type Campaign,
  type Donation,
  type Payout,
  canUpdateWalletNumber,
} from '../types'
import { ShareModal } from '../components/ShareModal'
import { CampaignUpdatesModal } from '../components/CampaignUpdatesModal'
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
  Settings,
  QrCode,
  Share2,
  Radio,
  FileText,
  Coffee,
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
  const [shareCampaign, setShareCampaign] = useState<Campaign | null>(null)
  const [shareTab, setShareTab] = useState<'share' | 'qr'>('qr')
  const [updatingCampaign, setUpdatingCampaign] = useState<Campaign | null>(null)

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left transition-colors">
      {/* En-tête Organisateur */}
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight font-heading">
              Tableau de bord
            </h1>
            {profile?.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Vérifié</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Compte de réception :{' '}
            <strong className="text-gray-800 dark:text-zinc-200 uppercase font-bold">
              {profile?.wallet_provider || 'Orange'} ({profile?.wallet_number || 'Non configuré'})
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profile?.is_admin && (
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl border border-zinc-700/80 transition-colors cursor-pointer shadow-xs"
              title="Console d'Administration Système"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>Console Système</span>
            </button>
          )}
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
            className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
            <span>Paramètres</span>
          </button>
        </div>
      </div>

      {/* Alerte si le portefeuille Mobile Money n'est pas encore configuré */}
      {!profile?.wallet_number && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-orange-950 dark:text-orange-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <p>
              <strong>Configuration requise :</strong> Vous n'avez pas encore renseigné votre numéro de versement Mobile Money.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/settings')}
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            Configurer maintenant
          </button>
        </div>
      )}

      {/* Alerte de sécurité verrouillage 30 jours (Section 19 du master prompt) */}
      {!walletUpdateStatus.allowed && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
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
        <div className="bg-white dark:bg-[#12141f] p-6 rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Solde disponible</span>
            <Coins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-950 dark:text-white">
            {availableBalance.toLocaleString()} FCFA
          </p>
          <button
            type="button"
            onClick={() => {
              setPayoutAmount(availableBalance >= 5000 ? availableBalance : '')
              setPayoutModalOpen(true)
            }}
            disabled={availableBalance < 5000}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Demander un retrait</span>
          </button>
        </div>

        {/* Total collecté net */}
        <div className="bg-white dark:bg-[#12141f] p-6 rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Total collecté (net)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400">
            {totalRaisedNet.toLocaleString()} FCFA
          </p>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            Total des contributions reçues
          </p>
        </div>

        {/* Déjà retiré */}
        <div className="bg-white dark:bg-[#12141f] p-6 rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Déjà retiré</span>
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-950 dark:text-white">
            {totalPaidOut.toLocaleString()} FCFA
          </p>
          {pendingPayouts > 0 ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{pendingPayouts.toLocaleString()} FCFA en traitement</span>
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">Versements Mobile Money validés</p>
          )}
        </div>

        {/* Soutiens & Moyenne */}
        <div className="bg-white dark:bg-[#12141f] p-6 rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Contributions</span>
            <Users className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-950 dark:text-white">
            {totalDonorsCount}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            Moyenne : {averageDonation.toLocaleString()} FCFA / don
          </p>
        </div>
      </div>

      {/* Onglets : Collectes / Dons reçus / Historique Retraits */}
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/60 p-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-white dark:bg-[#1a1d2c] text-orange-600 dark:text-orange-400 shadow-2xs'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Mes collectes ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'donations'
                ? 'bg-white dark:bg-[#1a1d2c] text-orange-600 dark:text-orange-400 shadow-2xs'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Contributions reçues ({donations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-white dark:bg-[#1a1d2c] text-orange-600 dark:text-orange-400 shadow-2xs'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
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
                <div className="text-center py-12 space-y-3 text-gray-400 dark:text-zinc-500">
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
                <div className="space-y-4">
                  {/* Bannières Outils Créateur : Kit Live & Lien Offrir un Thé */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bannière Kit Live & Stories */}
                    <div className="p-4 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/50 rounded-2xl flex items-start gap-3 text-xs">
                      <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">
                          Kit Live TikTok & Stories
                        </p>
                        <p className="text-gray-600 dark:text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                          Affichez votre QR code en direct et lancez le mode plein écran sur vos streams.
                        </p>
                      </div>
                    </div>

                    {/* Bannière Lien Offrir un Thé pour bio */}
                    <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 rounded-2xl flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            Micro-dons "Offrir un Thé"
                          </p>
                          <p className="text-gray-600 dark:text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                            Lien direct pour votre bio TikTok & Instagram pour recevoir des thés (500 F - 5 000 F).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(`/@${profile?.username || 'user'}?tip=true`)}
                        className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-amber-200 dark:border-zinc-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer"
                        title="Copier le lien Offrir un Thé"
                      >
                        {copiedLink === `/@${profile?.username || 'user'}?tip=true` ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {campaigns.map((c) => {
                      const pct = Math.min(100, Math.round((c.collected_amount / c.goal_amount) * 100))
                      const campaignUrl = `/@${profile?.username || 'user'}/${c.slug}`

                      return (
                        <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="space-y-1.5 max-w-md">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                {c.title}
                              </h4>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                                {c.status === 'active' ? 'Active' : c.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400">
                              <span>
                                <strong className="text-gray-800 dark:text-zinc-200">{c.collected_amount.toLocaleString()} FCFA</strong> / {c.goal_amount.toLocaleString()} FCFA ({pct}%)
                              </span>
                              <span>•</span>
                              <span>{c.contributions_count} soutiens</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onNavigate(`${campaignUrl}/live`)}
                              className="bg-gray-950 hover:bg-black dark:bg-zinc-900 dark:hover:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border border-zinc-800"
                              title="Mode Live Plein Écran TikTok & Stream"
                            >
                              <Radio className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                              <span>Mode Live</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setUpdatingCampaign(c)}
                              className="bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-orange-200/60 dark:border-orange-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Publier une actualité du terrain"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Nouvelle</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShareCampaign(c)
                                setShareTab('qr')
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Kit Live & QR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShareCampaign(c)
                                setShareTab('share')
                              }}
                              className="bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                              <span>Partager</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLink(campaignUrl)}
                              className="bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedLink === campaignUrl ? (
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedLink === campaignUrl ? 'Copié' : 'Lien'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onNavigate(campaignUrl)}
                              className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Voir</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Onglet 2 : Contributions reçues */}
          {activeTab === 'donations' && (
            <div>
              {donations.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
                  Aucune contribution reçue pour le moment. Partagez votre lien de collecte.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {donations.map((d) => {
                    const isTea = d.campaign_id?.startsWith('creator-tips-') || d.id?.startsWith('tea-')
                    return (
                      <div key={d.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 text-xs">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                              {d.is_anonymous ? 'Contributeur anonyme' : (d.donor_name || 'Anonyme')}
                            </span>
                            {isTea && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                                <Coffee className="w-2.5 h-2.5" />
                                <span>Thé offert</span>
                              </span>
                            )}
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                              {d.status === 'paid' ? 'Validé' : d.status}
                            </span>
                          </div>
                          {d.message && <p className="text-gray-600 dark:text-zinc-300 italic">"{d.message}"</p>}
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                          {new Date(d.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          +{d.amount.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              )}
            </div>
          )}

          {/* Onglet 3 : Retraits */}
          {activeTab === 'payouts' && (
            <div>
              {payouts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
                  Aucun versement demandé. Dès 5 000 FCFA disponibles, vous pouvez déclencher un retrait.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {payouts.map((p) => (
                    <div key={p.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white">
                            Vers {p.wallet_provider.toUpperCase()} ({p.wallet_number})
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                            {p.status === 'completed' ? 'Effectué' : p.status === 'under_review' ? 'En revue de conformité' : 'En cours'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                          Demandé le {new Date(p.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <p className="text-sm font-extrabold text-gray-950 dark:text-white">
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
          <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 sm:p-8 relative transition-colors">
            <h3 className="text-lg font-extrabold text-gray-950 dark:text-white mb-1.5 font-heading">Demande de retrait</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
              Les fonds seront versés sur votre compte{' '}
              <strong className="text-gray-900 dark:text-white uppercase">
                {profile?.wallet_provider} ({profile?.wallet_number})
              </strong>
              . Aucun frais supplémentaire n'est appliqué au retrait.
            </p>

            {payoutSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CircleCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">Demande de versement validée !</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Les fonds seront crédités directement sur votre numéro Mobile Money.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
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
                    className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#1a1d2c] rounded-xl px-4 py-3 text-base font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                    Solde disponible : {availableBalance.toLocaleString()} FCFA (Min. 5 000 FCFA)
                  </p>
                  {Number(payoutAmount) >= 5000 && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs space-y-1">
                      <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                        <span>Montant brut :</span>
                        <strong className="text-gray-900 dark:text-white">{Number(payoutAmount).toLocaleString()} FCFA</strong>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                        <span>Frais de service Donkai (5%) :</span>
                        <span>-{Math.round(Number(payoutAmount) * 0.05).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-gray-200 dark:border-zinc-700">
                        <span>Net versé sur Mobile Money :</span>
                        <span>{(Number(payoutAmount) - Math.round(Number(payoutAmount) * 0.05)).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  )}
                </div>

                {payoutError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{payoutError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayoutModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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

      {/* Modal de partage et Kit Live */}
      {shareCampaign && (
        <ShareModal
          title={shareCampaign.title}
          url={`${window.location.origin}/@${profile?.username || 'user'}/${shareCampaign.slug}`}
          defaultTab={shareTab}
          onClose={() => setShareCampaign(null)}
        />
      )}

      {/* Modal de publication d'actualité du terrain */}
      {updatingCampaign && (
        <CampaignUpdatesModal
          campaignId={updatingCampaign.id}
          campaignTitle={updatingCampaign.title}
          onClose={() => setUpdatingCampaign(null)}
          onUpdateCreated={() => {
            setUpdatingCampaign(null)
          }}
        />
      )}
    </div>
  )
}


