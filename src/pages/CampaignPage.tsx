import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Campaign, Donation } from '../types'
import { DonationCard } from '../components/DonationCard'
import { ShareModal } from '../components/ShareModal'
import { ReportModal } from '../components/ReportModal'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { CampaignUpdatesModal, type CampaignUpdate } from '../components/CampaignUpdatesModal'
import { useAuth } from '../context/AuthContext'
import {
  Share2,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  Flag,
  ChevronLeft,
  Heart,
  X,
  MessageSquare,
  Sparkles,
  QrCode,
  FileText,
  Plus,
  Radio,
} from '../components/Icons'

interface CampaignPageProps {
  username: string
  slug: string
  onNavigate: (path: string) => void
}

export const CampaignPage: React.FC<CampaignPageProps> = ({ username, slug, onNavigate }) => {
  const { user: authUser, profile: authProfile } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [updates, setUpdates] = useState<CampaignUpdate[]>([])
  const [activeTab, setActiveTab] = useState<'about' | 'updates' | 'supporters'>('about')
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalDefaultTab, setShareModalDefaultTab] = useState<'share' | 'qr'>('share')
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [paymentSuccessToast, setPaymentSuccessToast] = useState(false)
  const [feedFilter, setFeedFilter] = useState<'all' | 'messages'>('all')
  const [likedDonations, setLikedDonations] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('donkai_liked_donations') || '{}')
    } catch {
      return {}
    }
  })

  const isOwnerOrAdmin = Boolean(
    (authUser && (authUser.id === campaign?.user_id || authUser.id === campaign?.profile?.id)) ||
    authProfile?.is_admin
  )

  const toggleLikeDonation = (id: string) => {
    setLikedDonations((prev) => {
      const updated = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem('donkai_liked_donations', JSON.stringify(updated))
      } catch {
        // Ignorer si indisponible
      }
      return updated
    })
  }

  const getAvatarColors = (name: string) => {
    const palettes = [
      'from-orange-500 to-amber-500 text-white',
      'from-emerald-500 to-teal-500 text-white',
      'from-blue-500 to-indigo-500 text-white',
      'from-violet-500 to-purple-500 text-white',
      'from-rose-500 to-pink-500 text-white',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
    return palettes[hash % palettes.length]
  }

  const formatFcfa = (val: number): string => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Données de secours de démonstration si la collecte est introuvable en base de données
  const getDemoCampaign = (): Campaign => ({
    id: 'demo-campaign-gao',
    user_id: 'demo-user-kalifa',
    title: 'Projet d’accès à l’eau potable pour Gao',
    slug: 'eau-pour-gao',
    description:
      'Installation d’un forage solaire et d’un point d’eau potable accessible à plus de 450 familles à Gao. Ce projet permet d’éviter les trajets quotidiens de plus de 4 kilomètres pour trouver de l’eau salubre.',
    cover_image_url: null,
    goal_amount: 1500000,
    collected_amount: 980000,
    contributions_count: 64,
    currency: 'XOF',
    status: 'active',
    start_date: new Date(Date.now() - 15 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 45 * 86400000).toISOString(),
    beneficiary_type: 'self',
    beneficiary_name: 'Kalifa & Association Gao Solidarité',
    beneficiary_email: 'contact@gao-solidarite.org',
    beneficiary_phone: '+223 70 00 00 00',
    beneficiary_claimed: true,
    beneficiary_user_id: null,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'demo-user-kalifa',
      clerk_user_id: 'clerk_kalifa',
      username: username || 'kalifa',
      display_name: 'Kalifa Coulibaly',
      email: 'kalifa@donkai.app',
      bio: 'Porteur de projets éducatifs et d’accès à l’eau au Mali.',
      avatar_url: null,
      verification_status: 'verified',
      wallet_provider: 'orange',
      wallet_number: '+223 70 00 00 00',
      wallet_last_updated_at: null,
      is_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  })

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Chercher le profil par username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle()

      if (profileData) {
        // 2. Chercher la campagne par user_id et slug
        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', profileData.id)
          .eq('slug', slug.toLowerCase().trim())
          .maybeSingle()

        if (campaignData) {
          setCampaign({ ...campaignData, profile: profileData })

          // 3. Charger les dons payés
          const { data: donationsData } = await supabase
            .from('donations')
            .select('*')
            .eq('campaign_id', campaignData.id)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(15)

          setDonations(donationsData || [])

          // 4. Charger les actualités de la campagne
          try {
            const { data: updatesData } = await supabase
              .from('campaign_updates')
              .select('*')
              .eq('campaign_id', campaignData.id)
              .order('created_at', { ascending: false })

            const localUpdates = JSON.parse(localStorage.getItem(`donkai_updates_${campaignData.id}`) || '[]')
            setUpdates([...(updatesData || []), ...localUpdates])
          } catch {
            const localUpdates = JSON.parse(localStorage.getItem(`donkai_updates_${campaignData.id}`) || '[]')
            setUpdates(localUpdates)
          }

          setLoading(false)
          return
        }
      }

      // Si non trouvé en base ou démo demandée (ex: /@kalifa/eau-pour-gao)
      if (slug === 'eau-pour-gao' || !campaign) {
        const demo = getDemoCampaign()
        setCampaign(demo)

        // Récupérer d'éventuels dons locaux enregistrés pendant le test
        const localDons = JSON.parse(localStorage.getItem(`donkai_donations_${demo.id}`) || '[]')
        const initialDemoDonations: Donation[] = [
          {
            id: 'don-1',
            campaign_id: demo.id,
            amount: 25000,
            fee: 1350,
            net_amount: 23650,
            currency: 'XOF',
            donor_name: 'Aminata Diallo',
            donor_email: null,
            is_anonymous: false,
            message: 'Bravo pour cette belle initiative pour Gao ! Tout mon soutien.',
            status: 'paid',
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: 'don-2',
            campaign_id: demo.id,
            amount: 10000,
            fee: 600,
            net_amount: 9400,
            currency: 'XOF',
            donor_name: null,
            donor_email: null,
            is_anonymous: true,
            message: 'Que Dieu bénisse ce projet.',
            status: 'paid',
            created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          },
          {
            id: 'don-3',
            campaign_id: demo.id,
            amount: 50000,
            fee: 2600,
            net_amount: 47400,
            currency: 'XOF',
            donor_name: 'Dr. Oumar Koné',
            donor_email: null,
            is_anonymous: false,
            message: 'Heureux de contribuer à l’accès à l’eau potable.',
            status: 'paid',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
        ]

        // Actualités de terrain de démonstration pour Gao
        const initialDemoUpdates: CampaignUpdate[] = [
          {
            id: 'demo-update-2',
            campaign_id: demo.id,
            title: 'Coulage du socle en béton & préparatifs de la pompe solaire',
            content:
              'Les artisans locaux ont coulé le socle renforcé qui accueillera le réservoir et l’onduleur solaire. Le séchage prendra 48h avant l’installation du mât. Merci à tous pour votre mobilisation sans faille !',
            image_url: null,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: 'demo-update-1',
            campaign_id: demo.id,
            title: 'Arrivée de la foreuse à Gao & validation géologique',
            content:
              'L’équipe technique est sur place avec la foreuse rotative. Les études hydrogéologiques confirment une excellente nappe phréatique à 42 mètres de profondeur. Le forage démarre officiellement.',
            image_url: null,
            created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
          },
        ]
        const localUpdates = JSON.parse(localStorage.getItem(`donkai_updates_${demo.id}`) || '[]')
        setUpdates([...localUpdates, ...initialDemoUpdates])
        setDonations([...localDons, ...initialDemoDonations])
      } else {
        setError('Cette collecte est introuvable ou a été clôturée.')
      }
    } catch (err) {
      setError((err as Error).message || 'Erreur lors du chargement de la collecte.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('payment') === 'success') {
        setPaymentSuccessToast(true)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [username, slug])

  const handleDonationSuccess = (newDonation: Donation) => {
    setCampaign((prev) =>
      prev
        ? {
            ...prev,
            collected_amount: prev.collected_amount + newDonation.amount,
            contributions_count: prev.contributions_count + 1,
          }
        : null
    )
    setDonations((prev) => [newDonation, ...prev])
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-gray-400 font-medium text-sm">Chargement de la collecte...</p>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center max-w-md w-full shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Collecte introuvable</h2>
          <p className="text-sm text-gray-500 mb-6">
            L'URL demandée n'existe pas ou la collecte a été archivée.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm cursor-pointer"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const percentage = Math.min(100, Math.round((campaign.collected_amount / campaign.goal_amount) * 100))
  const currentUrl = window.location.href.split('?')[0]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 transition-colors">
      {/* Fil d'Ariane et actions du haut */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate(`/@${username}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Profil de @{username}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-800 dark:text-zinc-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Partager</span>
          </button>

          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            title="Signaler un abus ou contenu illégal"
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bannière de confirmation de paiement réussi */}
      {paymentSuccessToast && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Paiement validé avec succès
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Votre contribution SasPay a bien été enregistrée et la collecte a été actualisée. Merci pour votre générosité.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessToast(false)}
            aria-label="Fermer la notification"
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 p-1.5 rounded-lg hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerte si suspendue ou expirée */}
      {campaign.status === 'suspended' && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 dark:text-red-200">
            <p className="font-bold">Collecte temporairement suspendue</p>
            <p className="mt-0.5">
              Cette collecte fait actuellement l'objet d'une revue de conformité. Les contributions sont temporairement désactivées.
            </p>
          </div>
        </div>
      )}

      {/* Grille principale : Détails collecte & Formulaire de soutien */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne gauche : Contenu & Histoire */}
        <div className="lg:col-span-7 space-y-6">
          {/* Carte En-tête / Couverture / Titre */}
          <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
            {/* En-tête Organisateur / Bénéficiaire */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-orange-600 text-white flex items-center justify-center font-extrabold text-base shadow-xs shrink-0">
                {campaign.profile?.avatar_url ? (
                  <img
                    src={campaign.profile.avatar_url}
                    alt={campaign.profile?.display_name || username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (campaign.profile?.display_name || username).slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-extrabold text-gray-950 dark:text-white">
                    {campaign.profile?.display_name || username}
                  </span>
                  {campaign.profile?.verification_status === 'verified' && (
                    <VerifiedBadge size="sm" showText={false} />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Organisateur de la collecte • @{username}
                </p>
              </div>
            </div>

            {/* Photo / Affiche réelle de la collecte si présente */}
            {campaign.cover_image_url && (
              <div className="w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 shadow-xs">
                <img
                  src={campaign.cover_image_url}
                  alt={campaign.title}
                  className="w-full h-auto max-h-[380px] object-cover"
                  loading="eager"
                />
              </div>
            )}

            {/* Titre */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-tight font-heading">
                {campaign.title}
              </h1>
            </div>
          </div>

          {/* Navigation par onglets ergonomique */}
          <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-zinc-900 rounded-2xl text-xs font-bold border border-gray-200/60 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'about'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-2xs font-extrabold'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              À propos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('updates')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'updates'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-2xs font-extrabold'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Journal ({updates.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('supporters')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'supporters'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-2xs font-extrabold'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Soutiens ({donations.length})</span>
            </button>
          </div>

          {/* ONGLET 1 : À PROPOS */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
                  Histoire et contexte du projet
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {campaign.description}
                </p>

                {/* Informations sur le bénéficiaire */}
                {campaign.beneficiary_type === 'other' && campaign.beneficiary_name && (
                  <div className="p-4 bg-gray-50 dark:bg-[#181b29] rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 text-xs text-gray-700 dark:text-zinc-300 space-y-1 mt-4">
                    <p className="font-bold text-gray-900 dark:text-white">Bénéficiaire désigné des fonds :</p>
                    <p>{campaign.beneficiary_name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                      Les fonds collectés sont directement réservés au bénéficiaire conformément à nos règles de sécurité.
                    </p>
                  </div>
                )}
              </div>

              {/* Callout de la dernière nouvelle du terrain */}
              {updates.length > 0 && (
                <div className="bg-orange-50/70 dark:bg-orange-950/25 border border-orange-200/70 dark:border-orange-900/40 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                      <span className="text-xs font-extrabold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                        Dernière avancée du terrain
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                      {new Date(updates[0].created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {updates[0].title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {updates[0].content}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('updates')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 inline-flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>Consulter le journal complet ({updates.length} actualité{updates.length > 1 ? 's' : ''})</span>
                    <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              )}

              {/* Mini aperçu des soutiens */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-[#12141f] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xs text-xs">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className="text-gray-700 dark:text-zinc-300 font-medium">
                    {donations.length} contributeur{donations.length > 1 ? 's' : ''} engagé{donations.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('supporters')}
                  className="font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                >
                  Voir le mur des soutiens →
                </button>
              </div>
            </div>
          )}

          {/* ONGLET 2 : JOURNAL DU PROJET / ACTUALITÉS DE TERRAIN */}
          {activeTab === 'updates' && (
            <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
                      Journal d’avancement du terrain
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                      {updates.length} étape{updates.length > 1 ? 's' : ''} documentée{updates.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setUpdatesModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publier une nouvelle</span>
                  </button>
                )}
              </div>

              {/* Liste chronologique des actualités */}
              {updates.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                    Aucune actualité publiée pour le moment
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Le porteur du projet publiera ici les photos réelles et étapes au fur et à mesure de l'avancement.
                  </p>
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setUpdatesModalOpen(true)}
                      className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Publier la première actualité</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {updates.map((up, idx) => (
                    <div
                      key={up.id}
                      className="relative pl-6 sm:pl-8 pb-6 last:pb-0 border-l-2 border-orange-200 dark:border-orange-950/60 last:border-l-transparent"
                    >
                      {/* Puce timeline */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-600 ring-4 ring-orange-100 dark:ring-orange-950" />

                      <div className="bg-gray-50/80 dark:bg-[#181b29] rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/50 dark:border-orange-900/50">
                            Étape #{updates.length - idx}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                            {new Date(up.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-extrabold text-gray-950 dark:text-white font-heading">
                          {up.title}
                        </h4>

                        {up.image_url && (
                          <div className="rounded-xl overflow-hidden border border-gray-200/70 dark:border-zinc-700/60 bg-black/5 max-h-[320px]">
                            <img
                              src={up.image_url}
                              alt={up.title}
                              className="w-full h-auto object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                          {up.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3 : MUR DES SOUTIENS */}
          {activeTab === 'supporters' && (
            <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-950 dark:text-white font-heading">
                    Mur des soutiens
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {donations.length} contribution{donations.length > 1 ? 's' : ''} au total
                  </p>
                </div>
              </div>

              {/* Filtres Tous / Avec message */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-zinc-900 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFeedFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    feedFilter === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-2xs'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Tous ({donations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilter('messages')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    feedFilter === 'messages'
                      ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-2xs'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Messages ({donations.filter((d) => Boolean(d.message && d.message.trim().length > 0)).length})</span>
                </button>
              </div>
            </div>

            {/* Liste des contributions filtrées */}
            {(() => {
              const displayedDonations = donations.filter((d) => {
                if (feedFilter === 'messages') return Boolean(d.message && d.message.trim().length > 0)
                return true
              })

              if (displayedDonations.length === 0) {
                return (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">
                      {feedFilter === 'messages'
                        ? 'Aucun message d’encouragement pour l’instant.'
                        : 'Soyez le premier à soutenir cette collecte !'}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                      Chaque geste compte et encourage le porteur du projet.
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  {displayedDonations.map((d) => {
                    const isTopDonation = d.amount >= 25000
                    const donorDisplayName = d.is_anonymous || !d.donor_name ? 'Contributeur anonyme' : d.donor_name
                    const initials = d.is_anonymous || !d.donor_name ? '?' : donorDisplayName.slice(0, 2).toUpperCase()
                    const avatarGradient = getAvatarColors(donorDisplayName)
                    const isLiked = Boolean(likedDonations[d.id])

                    return (
                      <div
                        key={d.id}
                        className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181b29] border border-gray-100 dark:border-zinc-800/80 transition-all hover:border-orange-200 dark:hover:border-zinc-700 text-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar initiale dégradé */}
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-gray-950 dark:text-white text-xs sm:text-sm">
                                  {donorDisplayName}
                                </span>
                                {isTopDonation && (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Top soutien</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 dark:text-zinc-500 block">
                                {new Date(d.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200/40 dark:border-emerald-800/40">
                            +{d.amount.toLocaleString()} FCFA
                          </span>
                        </div>

                        {/* Message d'encouragement */}
                        {d.message && (
                          <div className="pl-11 pr-2">
                            <p className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 italic leading-relaxed text-xs">
                              "{d.message}"
                            </p>
                          </div>
                        )}

                        {/* Barre d'action / remerciement discret */}
                        <div className="pl-11 flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => toggleLikeDonation(d.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              isLiked
                                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${isLiked ? 'fill-orange-500 text-orange-500' : ''}`} />
                            <span>{isLiked ? 'Remercié' : 'Remercier'}</span>
                          </button>

                          <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Mobile Money vérifié
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}
        </div>

        {/* Colonne droite : Barre de progression & Formulaire de don direct */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Progression */}
          <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-heading font-extrabold text-gray-950 dark:text-white">
                    {formatFcfa(campaign.collected_amount)} FCFA
                  </span>
                  <span className="text-xs text-gray-400 dark:text-zinc-500 ml-1.5">
                    sur {formatFcfa(campaign.goal_amount)} FCFA
                  </span>
                </div>
                <span className="text-base font-heading font-extrabold text-orange-600 dark:text-orange-400">
                  {percentage}%
                </span>
              </div>

              {/* Jauge */}
              <div className="w-full h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Paliers visuels */}
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider pt-1">
                <span>0%</span>
                <span className={percentage >= 25 ? 'text-orange-600 dark:text-orange-400' : ''}>25%</span>
                <span className={percentage >= 50 ? 'text-orange-600 dark:text-orange-400' : ''}>50%</span>
                <span className={percentage >= 70 ? 'text-orange-600 dark:text-orange-400' : ''}>75%</span>
                <span className={percentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : ''}>100%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <span>
                  <strong className="text-gray-900 dark:text-white">{campaign.contributions_count}</strong> soutiens
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <span>Collecte active</span>
              </div>
            </div>
          </div>

          {/* Formulaire de don direct si la collecte est active */}
          {campaign.status === 'active' ? (
            <DonationCard
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              creatorName={campaign.profile?.display_name || username}
              onDonationSuccess={handleDonationSuccess}
            />
          ) : (
            <div className="p-6 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-3xl text-center text-xs text-gray-500 dark:text-zinc-400">
              Cette collecte n'accepte plus de nouveaux dons.
            </div>
          )}

          {/* Widget QR Code & Payer sur mobile */}
          <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white font-heading">
                    Flasher & Payer sur mobile
                  </h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                    Orange Money, Wave, Moov Money
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShareModalDefaultTab('qr')
                  setShareModalOpen(true)
                }}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer"
              >
                Affiche Live
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-gray-50/70 dark:bg-zinc-900/60 rounded-2xl border border-gray-100 dark:border-zinc-800">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                  currentUrl
                )}&margin=8&format=png`}
                alt={`QR Code ${campaign.title}`}
                className="w-32 h-32 rounded-xl bg-white p-2 shadow-2xs border border-gray-100 object-contain"
                loading="lazy"
              />
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-2 text-center">
                Scannez avec l’appareil photo de votre smartphone pour contribuer sans attendre.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(`/@${username}/${slug}/live`)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-950 hover:bg-black dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-orange-400 dark:text-white animate-pulse" />
              <span>Lancer le Mode Live Plein Écran</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShareModalDefaultTab('qr')
                setShareModalOpen(true)
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200/80 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Télécharger l’affiche pour Live & Stories</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals de partage et de signalement */}
      {shareModalOpen && (
        <ShareModal
          title={campaign.title}
          url={currentUrl}
          defaultTab={shareModalDefaultTab}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          targetUserId={campaign.user_id}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {/* Modal de publication d'actualité du terrain */}
      {updatesModalOpen && (
        <CampaignUpdatesModal
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          onClose={() => setUpdatesModalOpen(false)}
          onUpdateCreated={(newUpdate) => {
            setUpdates((prev) => [newUpdate, ...prev])
            setActiveTab('updates')
          }}
        />
      )}
    </div>
  )
}

