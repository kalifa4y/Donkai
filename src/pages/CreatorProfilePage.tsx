import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Campaign } from '../types'
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
} from '../components/Icons'

interface CreatorProfilePageProps {
  username: string
  onNavigate: (path: string) => void
}

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({ username, onNavigate }) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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
      } else {
        // Mode démonstration / fallback gracieux
        setProfile(getDemoProfile())
        setCampaigns(getDemoCampaigns())
      }
    } catch {
      setProfile(getDemoProfile())
      setCampaigns(getDemoCampaigns())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [username])

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href.split('?')[0])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400 font-medium text-sm">Chargement du profil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center max-w-sm w-full shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profil introuvable</h2>
          <p className="text-sm text-gray-500 mb-6">
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
  const totalSupporters = campaigns.reduce((acc, c) => acc + c.contributions_count, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      {/* En-tête du profil public */}
      <div className="bg-white rounded-3xl border border-orange-100/70 shadow-xs p-6 sm:p-8">
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
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                  {profile.display_name}
                </h1>
                {profile.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Identité vérifiée</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-orange-600 font-mono mt-0.5">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Statistiques d'impact public */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 pt-2 text-xs text-gray-500">
              <div>
                <strong className="text-base font-extrabold text-gray-900 mr-1">
                  {campaigns.length}
                </strong>
                collecte{campaigns.length > 1 ? 's' : ''}
              </div>
              <div>
                <strong className="text-base font-extrabold text-emerald-600 mr-1">
                  {totalCollected.toLocaleString()} FCFA
                </strong>
                mobilisés
              </div>
              <div>
                <strong className="text-base font-extrabold text-gray-900 mr-1">
                  {totalSupporters}
                </strong>
                soutiens reçus
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={copyProfileLink}
            className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 transition-colors shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Lien copié' : 'Partager profil'}</span>
          </button>
        </div>
      </div>

      {/* Collectes de la personne */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-950">
            Collectes ({campaigns.length})
          </h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-gray-100 text-center text-gray-400">
            <p className="text-sm font-medium">Aucune collecte active pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((c) => {
              const pct = Math.min(100, Math.round((c.collected_amount / c.goal_amount) * 100))
              return (
                <div
                  key={c.id}
                  onClick={() => onNavigate(`/@${profile.username}/${c.slug}`)}
                  className="bg-white rounded-3xl border border-orange-100/80 shadow-xs hover:shadow-md transition-all p-6 space-y-4 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-orange-600">
                        {c.status === 'active' ? 'En cours' : 'Terminée'}
                      </span>
                      <span className="font-mono text-gray-400">@{profile.username}/{c.slug}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-gray-950 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {c.title}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-gray-100">
                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-base font-extrabold text-gray-900">
                          {c.collected_amount.toLocaleString()} FCFA
                        </span>
                        <span className="text-gray-400 ml-1">
                          / {c.goal_amount.toLocaleString()} FCFA
                        </span>
                      </div>
                      <span className="font-bold text-orange-600">{pct}%</span>
                    </div>

                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>{c.contributions_count} soutiens</span>
                      <span className="inline-flex items-center gap-1 font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Voir la collecte</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
