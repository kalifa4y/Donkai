import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Campaign, Donation } from '../types'
import { VerifiedBadge } from '../components/VerifiedBadge'
import {
  Radio,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Heart,
  Users,
  Sparkles,
  QrCode,
} from '../components/Icons'

interface LiveStreamViewProps {
  username: string
  slug: string
  onNavigate: (path: string) => void
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({ username, slug, onNavigate }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [latestDonation, setLatestDonation] = useState<Donation | null>(null)
  const [alertGlow, setAlertGlow] = useState(false)

  const formatFcfa = (val: number): string => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Écoute de l'état plein écran du navigateur
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const loadLiveCampaign = async () => {
    try {
      // 1. Chercher le profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle()

      if (profileData) {
        // 2. Chercher la campagne
        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', profileData.id)
          .eq('slug', slug.toLowerCase().trim())
          .maybeSingle()

        if (campaignData) {
          setCampaign({ ...campaignData, profile: profileData })

          // 3. Charger les dons récents
          const { data: donationsData } = await supabase
            .from('donations')
            .select('*')
            .eq('campaign_id', campaignData.id)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(10)

          if (donationsData && donationsData.length > 0) {
            setDonations(donationsData)
            setLatestDonation(donationsData[0])
          }
          setLoading(false)
          return
        }
      }

      // Fallback démonstration si démo ou collecte locale
      const localCampaigns: Campaign[] = JSON.parse(
        localStorage.getItem('donkai_local_campaigns') || '[]'
      )
      const found = localCampaigns.find((c) => c.slug === slug)

      if (found) {
        setCampaign(found)
        const localDons = JSON.parse(localStorage.getItem(`donkai_donations_${found.id}`) || '[]')
        setDonations(localDons)
        if (localDons.length > 0) setLatestDonation(localDons[0])
      } else {
        // Démo par défaut
        const demoCampaign: Campaign = {
          id: 'demo-campaign-gao',
          user_id: 'demo-user-kalifa',
          title: 'Projet d’accès à l’eau potable pour Gao',
          slug: 'eau-pour-gao',
          description: 'Forage solaire et fontaine publique pour 450 familles à Gao.',
          cover_image_url: null,
          goal_amount: 1500000,
          collected_amount: 980000,
          contributions_count: 64,
          currency: 'XOF',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: null,
          beneficiary_type: 'self',
          beneficiary_name: 'Kalifa Coulibaly',
          beneficiary_email: null,
          beneficiary_phone: null,
          beneficiary_claimed: true,
          beneficiary_user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'demo-user-kalifa',
            clerk_user_id: 'usr_kalifa',
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
        }
        setCampaign(demoCampaign)
        const localDons = JSON.parse(localStorage.getItem(`donkai_donations_${demoCampaign.id}`) || '[]')
        const initialDons: Donation[] = [
          {
            id: 'don-1',
            campaign_id: demoCampaign.id,
            amount: 25000,
            fee: 1350,
            net_amount: 23650,
            currency: 'XOF',
            donor_name: 'Aminata Diallo',
            donor_email: null,
            is_anonymous: false,
            message: 'Bravo pour cette belle initiative pour Gao !',
            status: 'paid',
            created_at: new Date(Date.now() - 1000 * 120).toISOString(),
          },
          {
            id: 'don-2',
            campaign_id: demoCampaign.id,
            amount: 10000,
            fee: 600,
            net_amount: 9400,
            currency: 'XOF',
            donor_name: 'Moussa Traoré',
            donor_email: null,
            is_anonymous: false,
            message: 'Que Dieu bénisse ce projet.',
            status: 'paid',
            created_at: new Date(Date.now() - 1000 * 600).toISOString(),
          },
        ]
        const allDons = [...localDons, ...initialDons]
        setDonations(allDons)
        setLatestDonation(allDons[0])
      }
    } catch (err) {
      console.error('Erreur chargement mode live:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLiveCampaign()

    // Polling toutes les 12 secondes pour actualiser les données en live
    const interval = setInterval(() => {
      loadLiveCampaign()
    }, 12000)

    // Écoute Supabase Realtime si connecté
    const channel = supabase
      .channel('live-donations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
        },
        (payload) => {
          const newDonation = payload.new as Donation
          if (newDonation && newDonation.status === 'paid') {
            setLatestDonation(newDonation)
            setAlertGlow(true)
            setTimeout(() => setAlertGlow(false), 4500)
            loadLiveCampaign()
          }
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [username, slug])

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-[#07080c] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
          Initialisation du Mode Live TikTok...
        </p>
      </div>
    )
  }

  const percentage = Math.min(100, Math.round((campaign.collected_amount / campaign.goal_amount) * 100))
  const campaignPublicUrl = `${window.location.origin}/@${username}/${slug}`

  return (
    <div className="min-h-screen bg-[#07080e] text-white flex flex-col justify-between p-4 sm:p-8 select-none overflow-x-hidden relative font-sans">
      {/* Halo d'ambiance en arrière-plan */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-orange-600/15 via-orange-900/5 to-transparent blur-3xl pointer-events-none" />

      {/* 1. BARRE DE COMMANDE SUPÉRIEURE */}
      <header className="relative z-10 flex items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        {/* En direct indicateur */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate(`/@${username}/${slug}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter le Live</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 text-xs font-extrabold uppercase tracking-widest shadow-xs">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
            <span>DIRECT TIKTOK & STREAM</span>
          </div>
        </div>

        {/* Profil & Bouton Plein Écran */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center font-extrabold text-xs">
              {(campaign.profile?.display_name || username).slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-zinc-200">
              @{campaign.profile?.username || username}
            </span>
            {campaign.profile?.verification_status === 'verified' && (
              <VerifiedBadge size="sm" showText={false} />
            )}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. ZONE CENTRALE : AFFICHAGE LIVE HAUTE VISIBILITÉ */}
      <main className="relative z-10 my-auto py-6 sm:py-8 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
        {/* Colonne Gauche : Jauge d'objectif géante & KPIs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Objectif de la collecte</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight leading-tight">
              {campaign.title}
            </h1>
          </div>

          {/* Chiffres géants */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">
                  Montant collecté
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-5xl font-black font-heading text-emerald-400 tracking-tight">
                    {formatFcfa(campaign.collected_amount)}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-zinc-400">FCFA</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl sm:text-5xl font-black font-heading text-orange-500">
                  {percentage}%
                </span>
                <p className="text-[11px] text-zinc-400 font-medium">
                  sur {formatFcfa(campaign.goal_amount)} F
                </p>
              </div>
            </div>

            {/* Barre de progression ultra visible */}
            <div className="space-y-1.5">
              <div className="w-full h-5 bg-zinc-800/90 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700 shadow-md shadow-orange-500/50"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-zinc-500">
                <span>Départ</span>
                <span>50%</span>
                <span className="text-emerald-400">Objectif 100%</span>
              </div>
            </div>

            {/* Compteur de soutiens & derniers donateurs */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>
                    <strong className="text-white text-sm">{campaign.contributions_count}</strong> contributeurs mobilisés
                  </span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Mobile Money instantané
                </span>
              </div>

              {donations.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Derniers donateurs :
                  </span>
                  {donations.slice(0, 3).map((d) => (
                    <span
                      key={d.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-medium text-zinc-200"
                    >
                      <Heart className="w-2.5 h-2.5 text-orange-500 fill-orange-500" />
                      <span>{d.is_anonymous || !d.donor_name ? 'Anonyme' : d.donor_name}</span>
                      <strong className="text-emerald-400">+{formatFcfa(d.amount)} F</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne Droite : QR Code géant scannable par les spectateurs */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="bg-white text-zinc-950 p-6 sm:p-7 rounded-3xl shadow-2xl border-4 border-orange-500 text-center w-full max-w-sm space-y-4">
            <div className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm sm:text-base font-black font-heading uppercase tracking-wide text-zinc-900">
                Scannez pour donner en direct
              </h2>
            </div>

            {/* QR Code */}
            <div className="p-3 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
                  campaignPublicUrl
                )}&margin=4&format=png`}
                alt="QR Code Don Direct"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
              />
            </div>

            <p className="text-xs font-bold text-zinc-700 leading-snug">
              Pointez votre appareil photo • Don sécurisé en 30 secondes
            </p>

            {/* Logos opérateurs */}
            <div className="pt-2 border-t border-zinc-200 flex items-center justify-center gap-3">
              <div className="h-6 flex items-center">
                <img
                  src="/icons/orange-money.svg"
                  alt="Orange Money"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <div className="h-6 flex items-center">
                <img src="/icons/wave.png" alt="Wave" className="h-5 w-auto object-contain" />
              </div>
              <div className="h-6 flex items-center">
                <img
                  src="/icons/moov-money.png"
                  alt="Moov Money"
                  className="h-5 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BANDEAU TICKER DERNIER SOUTIEN (ALERT BOX) */}
      <footer className="relative z-10 pt-4 border-t border-zinc-800/80">
        <div
          className={`max-w-4xl mx-auto rounded-2xl p-3 sm:p-4 transition-all duration-500 flex items-center justify-between gap-4 ${
            alertGlow
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xl shadow-orange-500/40 scale-[1.02]'
              : 'bg-zinc-900/90 border border-zinc-800/80 text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <Heart className="w-4 h-4 fill-current text-orange-500 animate-pulse" />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                Dernier soutien en direct
              </p>
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {latestDonation ? (
                  <>
                    <strong className="text-amber-300">
                      {latestDonation.is_anonymous || !latestDonation.donor_name
                        ? 'Contributeur anonyme'
                        : latestDonation.donor_name}
                    </strong>{' '}
                    a soutenu à hauteur de{' '}
                    <span className="text-emerald-400 font-extrabold">
                      +{formatFcfa(latestDonation.amount)} FCFA
                    </span>
                    {latestDonation.message ? ` : "${latestDonation.message}"` : ''}
                  </>
                ) : (
                  'En attente du premier soutien en direct...'
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right text-[10px] text-zinc-400 font-bold hidden sm:block">
            {latestDonation ? (
              <span>
                {new Date(latestDonation.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  )
}
