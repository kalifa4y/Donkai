import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Campaign, Donation } from '../types'
import { DonationCard } from '../components/DonationCard'
import { ShareModal } from '../components/ShareModal'
import { ReportModal } from '../components/ReportModal'
import {
  Share2,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  Flag,
  ChevronLeft,
  Heart,
} from '../components/Icons'

interface CampaignPageProps {
  username: string
  slug: string
  onNavigate: (path: string) => void
}

export const CampaignPage: React.FC<CampaignPageProps> = ({ username, slug, onNavigate }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

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
          <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
            {/* En-tête Organisateur / Bénéficiaire */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-extrabold text-base shadow-xs">
                {(campaign.profile?.display_name || username).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-gray-950 dark:text-white">
                    {campaign.profile?.display_name || username}
                  </span>
                  {campaign.profile?.verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Identité vérifiée</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Organisateur de la collecte • @{username}
                </p>
              </div>
            </div>

            {/* Titre et description */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-tight font-heading">
                {campaign.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {campaign.description}
              </p>
            </div>

            {/* Informations sur le bénéficiaire */}
            {campaign.beneficiary_type === 'other' && campaign.beneficiary_name && (
              <div className="p-4 bg-gray-50 dark:bg-[#181b29] rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 text-xs text-gray-700 dark:text-zinc-300 space-y-1">
                <p className="font-bold text-gray-900 dark:text-white">Bénéficiaire désigné des fonds :</p>
                <p>{campaign.beneficiary_name}</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Les fonds collectés sont directement réservés au bénéficiaire conformément à nos règles de sécurité.
                </p>
              </div>
            )}
          </div>

          {/* Mur des soutiens et messages */}
          <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-gray-950 dark:text-white flex items-center gap-2 font-heading">
                <Heart className="w-4 h-4 text-orange-600 fill-orange-500" />
                <span>Contributions récentes</span>
              </h3>
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">
                {donations.length} soutien{donations.length > 1 ? 's' : ''}
              </span>
            </div>

            {donations.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 py-6 text-center">
                Soyez le premier à soutenir cette collecte !
              </p>
            ) : (
              <div className="space-y-3">
                {donations.map((d) => (
                  <div key={d.id} className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181b29] border border-gray-100 dark:border-zinc-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-950 dark:text-white">
                        {d.is_anonymous || !d.donor_name ? 'Contributeur anonyme' : d.donor_name}
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        +{d.amount.toLocaleString()} FCFA
                      </span>
                    </div>
                    {d.message && (
                      <p className="text-gray-600 dark:text-zinc-300 italic mt-1 leading-relaxed">
                        "{d.message}"
                      </p>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 block mt-1.5">
                      {new Date(d.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        </div>
      </div>

      {/* Modals de partage et de signalement */}
      {shareModalOpen && (
        <ShareModal
          title={campaign.title}
          url={currentUrl}
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
    </div>
  )
}
