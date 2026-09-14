import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Campaign, Donation } from '../types'
import {
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Coffee,
  Heart,
  Sparkles,
} from '../components/Icons'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { BuyTeaCard } from '../components/BuyTeaCard'

interface CreatorProfilePageProps {
  username: string
  onNavigate: (path: string) => void
}

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({ username, onNavigate }) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [teas, setTeas] = useState<Donation[]>([])
  const [activeTab, setActiveTab] = useState<'campaigns' | 'teas'>('campaigns')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [likedTeas, setLikedTeas] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('donkai_liked_teas') || '{}')
    } catch {
      return {}
    }
  })

  const toggleLikeTea = (id: string) => {
    setLikedTeas((prev) => {
      const updated = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem('donkai_liked_teas', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  // Données de secours de démonstration pour le profil
  const getDemoProfile = (): Profile => ({
    id: 'demo-user-kalifa',
    clerk_user_id: 'clerk_kalifa',
    username: username || 'kalifa',
    display_name: 'Kalifa Coulibaly',
    email: 'kalifa@donkai.app',
    bio: 'Porteur de projets éducatifs et d’accès à l’eau potable au Mali. Agir ensemble pour l’autonomie de nos communautés locales.',
    avatar_url: null,
    verification_status: 'verified',
    wallet_provider: 'orange',
    wallet_number: '+223 70 00 00 00',
    wallet_last_updated_at: null,
    is_admin: false,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  })

  const getDemoCampaigns = (): Campaign[] => [
    {
      id: 'demo-campaign-gao',
      user_id: 'demo-user-kalifa',
      title: 'Projet d’accès à l’eau potable pour Gao',
      slug: 'eau-pour-gao',
      description: 'Installation d’un forage solaire et d’un point d’eau potable accessible à plus de 450 familles.',
      cover_image_url: null,
      goal_amount: 1500000,
      collected_amount: 980000,
      contributions_count: 64,
      currency: 'XOF',
      status: 'active',
      start_date: new Date(Date.now() - 15 * 86400000).toISOString(),
      end_date: new Date(Date.now() + 45 * 86400000).toISOString(),
      beneficiary_type: 'self',
      beneficiary_name: null,
      beneficiary_email: null,
      beneficiary_phone: null,
      beneficiary_claimed: true,
      beneficiary_user_id: null,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-campaign-livres',
      user_id: 'demo-user-kalifa',
      title: 'Équipement de la bibliothèque scolaire de Tombouctou',
      slug: 'bibliotheque-tombouctou',
      description: 'Acquisition de 600 manuels scolaires et romans pour les collégiens.',
      cover_image_url: null,
      goal_amount: 800000,
      collected_amount: 520000,
      contributions_count: 38,
      currency: 'XOF',
      status: 'active',
      start_date: new Date(Date.now() - 40 * 86400000).toISOString(),
      end_date: new Date(Date.now() + 20 * 86400000).toISOString(),
      beneficiary_type: 'self',
      beneficiary_name: null,
      beneficiary_email: null,
      beneficiary_phone: null,
      beneficiary_claimed: true,
      beneficiary_user_id: null,
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const getDemoTeas = (): Donation[] => [
    {
      id: 'tea-demo-1',
      campaign_id: 'demo-campaign-gao',
      amount: 1500,
      fee: 75,
      net_amount: 1425,
      currency: 'XOF',
      donor_name: 'Aminata Diallo',
      donor_email: null,
      is_anonymous: false,
      message: 'Merci pour tes vidéos et ton engagement inspirant pour Gao ! Bon thé à toi et à toute l’équipe !',
      status: 'paid',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'tea-demo-2',
      campaign_id: 'demo-campaign-gao',
      amount: 500,
      fee: 25,
      net_amount: 475,
      currency: 'XOF',
      donor_name: 'Mamadou Traoré',
      donor_email: null,
      is_anonymous: false,
      message: 'Force pour la suite. On te suit fidèlement depuis Ségou.',
      status: 'paid',
      created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    {
      id: 'tea-demo-3',
      campaign_id: 'demo-campaign-gao',
      amount: 5000,
      fee: 250,
      net_amount: 4750,
      currency: 'XOF',
      donor_name: 'Fatoumata Bamba',
      donor_email: null,
      is_anonymous: false,
      message: 'Un Dibi bien mérité pour soutenir toute ton énergie ! Ne lâche rien.',
      status: 'paid',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]

  const loadData = async () => {
    setLoading(true)

    try {
      const cleanUsername = username.toLowerCase().trim()
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle()

      if (profileData) {
        setProfile(profileData)

        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })

        setCampaigns(campaignsData || [])

        // Charger les thés reçus
        const localTeas = JSON.parse(
          localStorage.getItem(`donkai_teas_${profileData.id}`) || '[]'
        )
        setTeas(localTeas)
      } else {
        // Mode démonstration / fallback gracieux
        const demoProf = getDemoProfile()
        setProfile(demoProf)
        setCampaigns(getDemoCampaigns())
        const localTeas = JSON.parse(
          localStorage.getItem(`donkai_teas_${demoProf.id}`) || '[]'
        )
        setTeas([...localTeas, ...getDemoTeas()])
      }
    } catch {
      const demoProf = getDemoProfile()
      setProfile(demoProf)
      setCampaigns(getDemoCampaigns())
      setTeas(getDemoTeas())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [username])

  // Prise en charge du paramètre ?tip=true pour scroller vers la carte d'achat de thé
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tip') === 'true') {
        const el = document.getElementById('buy-tea-section')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
      if (params.get('tab') === 'teas') {
        setActiveTab('teas')
      }
    }
  }, [loading])

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href.split('?')[0])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyTipLink = () => {
    const tipUrl = `${window.location.origin}/@${username}?tip=true`
    navigator.clipboard.writeText(tipUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400 dark:text-zinc-500 font-medium text-sm">Chargement du profil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-[#12141f] p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 text-center max-w-sm w-full shadow-sm">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profil introuvable</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
            L'identifiant @{username} n'est associé à aucun profil actif.
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

  const totalCollected = campaigns.reduce((acc, c) => acc + c.collected_amount, 0)
  const totalSupporters = campaigns.reduce((acc, c) => acc + c.contributions_count, 0) + teas.length
  const totalTeasAmount = teas.reduce((acc, t) => acc + t.amount, 0)

  const getTeaLabel = (amount: number): string => {
    if (amount >= 5000) return 'a offert un Dibi'
    if (amount >= 1500) return 'a offert 3 Thés'
    return 'a offert 1 Thé'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      {/* En-tête du profil public */}
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-orange-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              (profile.display_name || profile.username).slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                  {profile.display_name}
                </h1>
                {profile.verification_status === 'verified' && (
                  <VerifiedBadge size="md" showText={false} />
                )}
              </div>
              <p className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono mt-0.5">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 dark:text-zinc-300 max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Statistiques d'impact public */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 sm:gap-6 pt-2 text-xs text-gray-500 dark:text-zinc-400">
              <div>
                <strong className="text-base font-heading font-extrabold text-gray-900 dark:text-white mr-1">
                  {campaigns.length}
                </strong>
                collecte{campaigns.length > 1 ? 's' : ''}
              </div>
              <div>
                <strong className="text-base font-heading font-extrabold text-emerald-600 dark:text-emerald-400 mr-1">
                  {(totalCollected + totalTeasAmount).toLocaleString()} FCFA
                </strong>
                mobilisés
              </div>
              <div>
                <strong className="text-base font-heading font-extrabold text-amber-600 dark:text-amber-400 mr-1">
                  {teas.length}
                </strong>
                thé{teas.length > 1 ? 's' : ''} offert{teas.length > 1 ? 's' : ''}
              </div>
              <div>
                <strong className="text-base font-heading font-extrabold text-gray-900 dark:text-white mr-1">
                  {totalSupporters}
                </strong>
                soutiens reçus
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              onClick={copyProfileLink}
              className="inline-flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Partager profil'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grille principale : Contenu & Onglets à gauche, Widget Offrir un Thé à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne gauche (7 colonnes) : Collectes & Mur des Thés reçus */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation par onglets */}
          <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-zinc-900 rounded-2xl text-xs font-bold border border-gray-200/60 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('campaigns')}
              className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'campaigns'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-2xs font-extrabold'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Collectes ({campaigns.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teas')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'teas'
                  ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-2xs font-extrabold'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Thés reçus & Mots ({teas.length})</span>
            </button>
          </div>

          {/* ONGLET 1 : COLLECTES DU CRÉATEUR */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <div className="p-12 bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 text-center text-gray-400 dark:text-zinc-500">
                  <p className="text-sm font-medium">Aucune collecte active pour le moment.</p>
                  <p className="text-xs text-gray-400 mt-1">Vous pouvez toujours offrir un thé pour soutenir directement ce créateur.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((c) => {
                    const pct = Math.min(100, Math.round((c.collected_amount / c.goal_amount) * 100))
                    return (
                      <div
                        key={c.id}
                        onClick={() => onNavigate(`/@${profile.username}/${c.slug}`)}
                        className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all overflow-hidden cursor-pointer group flex flex-col sm:flex-row justify-between"
                      >
                        {c.cover_image_url && (
                          <div className="sm:w-48 h-36 sm:h-auto shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-zinc-800">
                            <img
                              src={c.cover_image_url}
                              alt={c.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-orange-600 dark:text-orange-400">
                                {c.status === 'active' ? 'En cours' : 'Terminée'}
                              </span>
                              <span className="font-mono text-gray-400 dark:text-zinc-500 text-[11px]">
                                @{profile.username}/{c.slug}
                              </span>
                            </div>

                            <h3 className="text-base font-extrabold text-gray-950 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                              {c.title}
                            </h3>

                            <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                              {c.description}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                            <div className="flex items-baseline justify-between text-xs">
                              <div>
                                <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                                  {c.collected_amount.toLocaleString()} FCFA
                                </span>
                                <span className="text-gray-400 dark:text-zinc-500 ml-1 text-[11px]">
                                  / {c.goal_amount.toLocaleString()} FCFA
                                </span>
                              </div>
                              <span className="font-bold text-orange-600 dark:text-orange-400">{pct}%</span>
                            </div>

                            <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-zinc-500 pt-0.5">
                              <span>{c.contributions_count} soutiens</span>
                              <span className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform">
                                <span>Voir le projet</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ONGLET 2 : THÉS REÇUS & MUR DES MESSAGES */}
          {activeTab === 'teas' && (
            <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
                      Thés reçus & Encouragements
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                      {teas.length} geste{teas.length > 1 ? 's' : ''} de soutien direct
                    </p>
                  </div>
                </div>
              </div>

              {teas.length === 0 ? (
                <div className="py-12 text-center space-y-2 text-gray-400 dark:text-zinc-500">
                  <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                    Soyez le premier à offrir un thé à @{profile.username} !
                  </p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Un geste simple pour donner de la force et manifester votre appréciation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teas.map((t) => {
                    const isLiked = Boolean(likedTeas[t.id])
                    const donorName = t.is_anonymous || !t.donor_name ? 'Un supporter' : t.donor_name

                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181b29] border border-gray-100 dark:border-zinc-800/80 text-xs space-y-2.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                              <Coffee className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-gray-950 dark:text-white text-xs">
                                  {donorName}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                                  {getTeaLabel(t.amount)}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                {new Date(t.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200/40 dark:border-emerald-800/40">
                            +{t.amount.toLocaleString()} FCFA
                          </span>
                        </div>

                        {t.message && (
                          <p className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 italic leading-relaxed text-xs">
                            "{t.message}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => toggleLikeTea(t.id)}
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
                            Mobile Money instantané
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Colonne droite (5 colonnes) : Widget Offrir un Thé sticky */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <BuyTeaCard
            creatorId={profile.id}
            creatorUsername={profile.username}
            creatorDisplayName={profile.display_name}
            targetCampaignId={campaigns.length > 0 ? campaigns[0].id : null}
            onTeaBought={(newTea) => {
              setTeas((prev) => [newTea, ...prev])
              setActiveTab('teas')
            }}
          />

          {/* Carte Astuce Bio TikTok & Réseaux */}
          <div className="bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 rounded-3xl p-5 space-y-2.5 text-xs text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h4 className="font-extrabold text-gray-900 dark:text-white">
                Astuce Bio TikTok & Instagram
              </h4>
            </div>
            <p className="text-gray-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              Ajoutez votre lien direct en bio pour que vos spectateurs puissent vous offrir un thé en 30 secondes sans chercher :
            </p>
            <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 font-mono text-[10px] text-gray-800 dark:text-zinc-300 truncate">
              {window.location.origin}/@{username}?tip=true
            </div>
            <button
              type="button"
              onClick={copyTipLink}
              className="inline-flex items-center gap-1.5 font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer pt-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Lien spécial bio copié !' : 'Copier le lien direct pour ma bio'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
