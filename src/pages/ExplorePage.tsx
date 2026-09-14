import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Search,
  Compass,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from '../components/Icons'
import { VerifiedBadge } from '../components/VerifiedBadge'

interface ExploreCampaign {
  id: string
  title: string
  slug: string
  description: string
  cover_image_url?: string | null
  goal_amount: number
  collected_amount: number
  contributions_count: number
  status: string
  created_at: string
  profiles?: {
    username: string
    display_name: string
    avatar_url: string | null
    verification_status: string
  }
}

interface ExplorePageProps {
  onNavigate: (path: string) => void
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate }) => {
  const [campaigns, setCampaigns] = useState<ExploreCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortFilter, setSortFilter] = useState<'popular' | 'recent' | 'all'>('popular')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    setError(null)

    // Watchdog de sécurité : interrompt le spinner après 6 secondes si le réseau est bloqué
    const timeoutPromise = new Promise<{ data: any[] | null; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Délai de connexion dépassé (timeout).')), 6000)
    )

    try {
      const fetchPromise = supabase
        .from('campaigns')
        .select(`
          id,
          title,
          slug,
          description,
          cover_image_url,
          goal_amount,
          collected_amount,
          contributions_count,
          status,
          created_at,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            verification_status
          )
        `)
        .eq('status', 'active')
        .order('collected_amount', { ascending: false })

      const { data, error: fetchErr } = await Promise.race([fetchPromise, timeoutPromise])

      if (fetchErr) throw fetchErr

      // Formater pour TypeScript (profiles pouvant être un objet ou un tableau selon le join PostgREST)
      const formatted = (data || []).map((item: any) => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      }))

      setCampaigns(formatted)
    } catch (err) {
      console.error('Erreur chargement exploration:', err)
      setError("Impossible de charger les collectes en direct actuellement. Veuillez vérifier votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  const formatFcfa = (val: number): string => {
    return (val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Filtrage par recherche
  const filtered = campaigns.filter((c) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const titleMatch = c.title?.toLowerCase().includes(q)
    const descMatch = c.description?.toLowerCase().includes(q)
    const creatorMatch =
      c.profiles?.display_name?.toLowerCase().includes(q) ||
      c.profiles?.username?.toLowerCase().includes(q)
    return titleMatch || descMatch || creatorMatch
  })

  // Tri sélectionné
  const sorted = [...filtered].sort((a, b) => {
    if (sortFilter === 'popular') {
      return (b.collected_amount || 0) - (a.collected_amount || 0)
    }
    if (sortFilter === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return 0
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      {/* Hero Exploration */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>Explorer les projets</span>
        </div>

        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-gray-950 dark:text-white tracking-tight">
          Découvrez et soutenez des initiatives qui ont du sens
        </h1>

        <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed">
          Projets communautaires, causes solidaires, urgences médicales et créateurs au Mali et en Afrique de l'Ouest.
        </p>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
        {/* Barre de recherche */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un projet, une cause, un créateur..."
            className="w-full bg-white dark:bg-[#12131a] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600 shadow-xs transition-all"
          />
        </div>

        {/* Boutons de tri */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl border border-gray-200/50 dark:border-zinc-700/50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSortFilter('popular')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              sortFilter === 'popular'
                ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            <span>Plus populaires</span>
          </button>

          <button
            type="button"
            onClick={() => setSortFilter('recent')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              sortFilter === 'recent'
                ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Plus récentes</span>
          </button>
        </div>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
            Chargement des collectes en direct...
          </p>
        </div>
      )}

      {/* Message d'erreur */}
      {error && !loading && (
        <div className="max-w-md mx-auto p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-center gap-3 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Liste des Collectes Réelles */}
      {!loading && !error && (
        <>
          {sorted.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#12131a] border border-gray-100 dark:border-zinc-800 rounded-3xl p-8 max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-gray-900 dark:text-white">
                Aucune collecte trouvée
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Essayez d'autres mots-clés ou réinitialisez votre recherche.
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((c) => {
                const goal = c.goal_amount || 1
                const collected = c.collected_amount || 0
                const percent = Math.min(100, Math.round((collected / goal) * 100))
                const username = c.profiles?.username || 'collecte'
                const campaignUrl = `/@${username}/${c.slug}`

                return (
                  <div
                    key={c.id}
                    onClick={() => onNavigate(campaignUrl)}
                    className="group bg-white dark:bg-[#12131a] rounded-3xl border border-gray-100 dark:border-zinc-800/80 hover:border-orange-500/50 dark:hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-950/5 transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
                  >
                    {/* Affiche ou photo de couverture si disponible */}
                    {c.cover_image_url && (
                      <div className="w-full h-40 overflow-hidden bg-gray-100 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800">
                        <img
                          src={c.cover_image_url}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* En-tête de la carte créateur */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-sm shrink-0">
                            {c.profiles?.avatar_url ? (
                              <img
                                src={c.profiles.avatar_url}
                                alt={c.profiles.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (c.profiles?.display_name || username).slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                                {c.profiles?.display_name || username}
                              </span>
                              {c.profiles?.verification_status === 'verified' && (
                                <VerifiedBadge size="sm" showText={false} />
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                              @{username}
                            </span>
                          </div>
                        </div>

                        {/* Titre & description */}
                        <div>
                          <h3 className="font-heading font-bold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                            {c.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-3 mt-1.5 leading-relaxed">
                            {c.description}
                          </p>
                        </div>
                      </div>

                    {/* Progression & Montants */}
                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800/80 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-extrabold text-sm text-gray-950 dark:text-white">
                            {formatFcfa(collected)} FCFA
                          </span>
                          <span className="text-gray-500 dark:text-zinc-400 text-[11px]">
                            sur {formatFcfa(goal)} FCFA ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 pt-1">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Users className="w-3.5 h-3.5 text-orange-600" />
                          <span>{c.contributions_count || 0} soutiens</span>
                        </div>

                        <div className="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 text-xs group-hover:translate-x-1 transition-transform">
                          <span>Soutenir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
