import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import {
  ArrowRight,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Target,
  Share2,
  CheckCircle2,
  Lock,
  ChevronDown,
  ExternalLink,
  Compass,
  Users,
  ChevronLeft,
  Loader2,
} from '../components/Icons'

interface HomePageProps {
  onNavigate: (path: string) => void
}

interface FaqItem {
  question: string
  highlight: string
  answer: string
}

interface PopularCampaign {
  id: string
  title: string
  slug: string
  description: string
  goal_amount: number
  collected_amount: number
  contributions_count: number
  profiles?: {
    username: string
    display_name: string
    verification_status: string
  }
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t, language } = useI18n()
  const { user } = useAuth()

  // 3 collectes populaires réelles pour le Hero Carrousel
  const [popularCampaigns, setPopularCampaigns] = useState<PopularCampaign[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [loadingPopular, setLoadingPopular] = useState(true)

  // Onglet actif pour la section "Le produit en action"
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'campaign' | 'dashboard' | 'profile'>('campaign')

  // FAQ Accordion interactif
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  useEffect(() => {
    const fetchTopCampaigns = async () => {
      try {
        setLoadingPopular(true)
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            id,
            title,
            slug,
            description,
            goal_amount,
            collected_amount,
            contributions_count,
            profiles:user_id (
              username,
              display_name,
              verification_status
            )
          `)
          .eq('status', 'active')
          .order('collected_amount', { ascending: false })
          .limit(3)

        if (!error && data) {
          const formatted = data.map((item: any) => ({
            ...item,
            profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          }))
          setPopularCampaigns(formatted)
        }
      } catch (err) {
        console.error('Erreur chargement collectes populaires:', err)
      } finally {
        setLoadingPopular(false)
      }
    }
    fetchTopCampaigns()
  }, [])

  const handleCreateCampaignClick = () => {
    if (user) {
      onNavigate('/create')
    } else {
      onNavigate('/login')
    }
  }

  const formatFcfa = (val: number): string => {
    return (val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const faqListFr: FaqItem[] = [
    {
      question: 'Comment créer une collecte sur DONKAI ?',
      highlight: 'Moins de 2 minutes suffisent pour lancer votre collecte.',
      answer:
        ' Cliquez sur "Créer une collecte", renseignez votre objectif financier en FCFA, désignez le bénéficiaire des fonds (vous-même ou un tiers) et recevez immédiatement votre lien public dédié.',
    },
    {
      question: 'Les donateurs doivent-ils créer un compte ?',
      highlight: 'Non. Aucun compte n’est requis pour les donateurs.',
      answer:
        ' Vos contributeurs accèdent directement au lien de votre collecte depuis WhatsApp ou les réseaux sociaux, choisissent leur montant et valident en 10 secondes via Orange Money, Wave ou Moov Money.',
    },
    {
      question: 'Y a-t-il des frais pour les donateurs ?',
      highlight: 'Aucun frais pour les donateurs.',
      answer:
        ' Les contributeurs ne payent aucun frais supplémentaire : la totalité du montant choisi va directement au soutien du projet sans mauvaise surprise.',
    },
    {
      question: 'Comment et quand puis-je retirer l’argent collecté ?',
      highlight: 'Vous pouvez demander un versement à tout moment dès 5 000 FCFA disponibles.',
      answer:
        ' Le transfert est envoyé directement vers votre numéro Mobile Money (Orange, Wave, Moov) après validation rapide par notre équipe de sécurité.',
    },
    {
      question: 'Quels moyens de paiement sont supportés ?',
      highlight: 'Orange Money, Wave et Moov Money sont acceptés nativement.',
      answer:
        ' Les contributeurs au Mali, au Sénégal, en Côte d’Ivoire, au Bénin, au Togo et en Guinée peuvent soutenir vos projets directement depuis leur smartphone.',
    },
    {
      question: 'Comment DONKAI protège-t-il les fonds contre la fraude ?',
      highlight: 'Grâce à un protocole de sécurité en trois volets :',
      answer:
        ' Un verrouillage anti-fraude de 30 jours sur toute mise à jour de numéro de retrait, une vérification d’identité (KYC) obligatoire au palier de 500 000 FCFA, et une modération active des signalements sous 24h.',
    },
  ]

  const faqListEn: FaqItem[] = [
    {
      question: 'How do I start a campaign on DONKAI?',
      highlight: 'Starting a campaign takes under 2 minutes.',
      answer:
        ' Click "Start a campaign", set your funding goal in FCFA, specify the beneficiary (yourself or a third party), and get your dedicated public link instantly.',
    },
    {
      question: 'Do donors need to create an account?',
      highlight: 'No. Donors never need to create an account.',
      answer:
        ' Supporters open your link directly from WhatsApp or social media, choose an amount, and complete their payment in seconds via Orange Money, Wave, or Moov Money.',
    },
    {
      question: 'Are there any fees for donors?',
      highlight: 'Zero fees for donors.',
      answer:
        ' Supporters pay zero extra fees: the entire selected amount goes directly to backing the cause with complete peace of mind.',
    },
    {
      question: 'How and when can I withdraw collected funds?',
      highlight: 'You can request a payout anytime starting from 5,000 FCFA.',
      answer:
        ' Funds are transferred directly to your Mobile Money account (Orange, Wave, Moov) following rapid verification by our safety team.',
    },
    {
      question: 'Which payment methods are accepted?',
      highlight: 'Orange Money, Wave, and Moov Money are natively supported.',
      answer:
        ' Supporters across Mali, Senegal, Ivory Coast, Benin, Togo, and Guinea can contribute directly from their phone without a credit card.',
    },
    {
      question: 'How does DONKAI protect campaigns from fraud?',
      highlight: 'Through a strict three-tier protection protocol:',
      answer:
        ' A 30-day security lockout on any withdrawal phone number change, mandatory KYC identity verification at 500,000 FCFA, and active human moderation on community reports within 24 hours.',
    },
  ]

  const faqList = language === 'en' ? faqListEn : faqListFr

  return (
    <div className="flex flex-col items-center bg-[#faf9f6] dark:bg-[#0c0d12] text-gray-900 dark:text-zinc-100 overflow-hidden transition-colors">
      {/* 1. HERO SECTION (Visuel avant le texte, scan en 5 secondes) */}
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
        {/* Badge d'accroche direct */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 text-orange-950 dark:text-orange-300 text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span>{t('hero.badge')}</span>
        </div>

        {/* Titre percutant Cal Sans */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          {t('hero.title_1')}{' '}
          <span className="text-orange-600 dark:text-orange-500">
            {t('hero.title_2')}
          </span>{' '}
          <br className="hidden sm:inline" />
          {t('hero.title_3')}
        </h1>

        {/* Sous-titre court et limpide */}
        <p className="text-sm sm:text-lg text-gray-600 dark:text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed font-normal">
          {t('hero.subtitle')}
        </p>

        {/* CTA Unique & Identifiable */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <button
            type="button"
            onClick={handleCreateCampaignClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition-all text-sm sm:text-base cursor-pointer"
          >
            <span>{t('hero.cta_primary')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/explore')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-800 dark:text-zinc-200 font-bold py-3.5 px-6 rounded-2xl shadow-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-sm cursor-pointer"
          >
            <Compass className="w-4 h-4 text-orange-600" />
            <span>Explorer les collectes</span>
          </button>
        </div>

        {/* CARROUSEL DYNAMIQUE DES 3 COLLECTES POPULAIRES EN DIRECT */}
        <div className="relative max-w-2xl mx-auto text-left">
          {/* Lueur subtile en arrière-plan */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-400/20 via-amber-300/20 to-orange-500/20 rounded-[32px] blur-xl opacity-70 pointer-events-none" />

          <div className="relative bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100 dark:border-zinc-800 shadow-xl p-5 sm:p-7 space-y-5">
            {loadingPopular ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-7 h-7 text-orange-600 animate-spin" />
                <p className="text-xs text-gray-400">Chargement des collectes populaires...</p>
              </div>
            ) : popularCampaigns.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                  Soyez le premier à lancer une collecte communautaire !
                </p>
                <button
                  type="button"
                  onClick={handleCreateCampaignClick}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  Créer ma collecte maintenant &rarr;
                </button>
              </div>
            ) : (
              (() => {
                const camp = popularCampaigns[activeSlide] || popularCampaigns[0]
                const goal = camp.goal_amount || 1
                const collected = camp.collected_amount || 0
                const progress = Math.min(100, Math.round((collected / goal) * 100))
                const username = camp.profiles?.username || 'collecte'
                const displayName = camp.profiles?.display_name || username
                const isVerified = camp.profiles?.verification_status === 'verified'
                const targetUrl = `/@${username}/${camp.slug}`

                return (
                  <div className="space-y-4">
                    {/* En-tête du carrousel avec navigation 1, 2, 3 */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-[11px] font-bold px-2.5 py-1 rounded-xl">
                          <Sparkles className="w-3 h-3" />
                          Collecte populaire #{activeSlide + 1}
                        </span>
                      </div>

                      {/* Contrôles carrousel */}
                      <div className="flex items-center gap-1.5">
                        {popularCampaigns.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveSlide(idx)}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              activeSlide === idx
                                ? 'w-5 bg-orange-600'
                                : 'w-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300'
                            }`}
                          />
                        ))}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlide((prev) =>
                                prev === 0 ? popularCampaigns.length - 1 : prev - 1
                              )
                            }
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlide((prev) =>
                                prev === popularCampaigns.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Profil de l'organisateur */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-heading font-bold text-sm shadow-xs">
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-gray-950 dark:text-white font-heading">
                              {displayName}
                            </span>
                            {isVerified && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Vérifié</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono">
                            @{username}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate(targetUrl)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <span>Soutenir</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Titre & Description de la collecte */}
                    <div>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-gray-950 dark:text-white leading-snug">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {camp.description}
                      </p>
                    </div>

                    {/* Progression dynamique */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xl sm:text-2xl font-heading font-extrabold text-gray-950 dark:text-white">
                            {formatFcfa(collected)} FCFA
                          </span>
                          <span className="text-xs text-gray-400 dark:text-zinc-500 ml-1.5 font-medium">
                            sur {formatFcfa(goal)} FCFA
                          </span>
                        </div>
                        <span className="text-sm font-heading font-extrabold text-orange-600 dark:text-orange-400">
                          {progress}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-gray-400 dark:text-zinc-500 font-medium pt-1">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-orange-600" />
                          <span>{camp.contributions_count || 0} soutiens reçus</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('/explore')}
                          className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
                        >
                          Voir toutes les collectes &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </div>
        </div>
      </section>

      {/* 2. COMMENT ÇA MARCHE (Visuels d'interfaces miniatures, règle scan 5s) */}
      <section id="how-it-works" className="w-full bg-white dark:bg-[#0c0d12] py-20 px-4 sm:px-6 border-y border-gray-100 dark:border-zinc-800 transition-colors">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight">
              {t('how.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400">
              {t('how.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Étape 1 : Créez */}
            <div className="p-6 rounded-3xl bg-[#faf9f6] dark:bg-[#13151f] border border-gray-200/70 dark:border-zinc-800 flex flex-col justify-between space-y-4 hover:border-orange-200 dark:hover:border-orange-800/60 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider font-heading">
                    Étape 01
                  </span>
                </div>
                <h3 className="text-lg font-heading font-extrabold text-gray-950 dark:text-white">
                  {t('how.step1_title')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {t('how.step1_desc')}
                </p>
              </div>

              {/* Interface miniature 1 : Création */}
              <div className="p-3.5 bg-white dark:bg-[#1a1d2c] rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 shadow-2xs space-y-2">
                <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Aperçu formulaire
                </div>
                <div className="p-2 bg-gray-50 dark:bg-zinc-800/80 rounded-lg text-xs font-bold text-gray-800 dark:text-zinc-200 flex justify-between items-center">
                  <span>Objectif</span>
                  <span className="text-orange-600 dark:text-orange-400 font-heading">1 500 000 FCFA</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Validation instantanée</span>
                </div>
              </div>
            </div>

            {/* Étape 2 : Partagez */}
            <div className="p-6 rounded-3xl bg-[#faf9f6] dark:bg-[#13151f] border border-gray-200/70 dark:border-zinc-800 flex flex-col justify-between space-y-4 hover:border-orange-200 dark:hover:border-orange-800/60 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-heading">
                    Étape 02
                  </span>
                </div>
                <h3 className="text-lg font-heading font-extrabold text-gray-950 dark:text-white">
                  {t('how.step2_title')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {t('how.step2_desc')}
                </p>
              </div>

              {/* Interface miniature 2 : Partage */}
              <div className="p-3.5 bg-white dark:bg-[#1a1d2c] rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 shadow-2xs space-y-2">
                <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Votre URL dédiée
                </div>
                <div className="p-2 bg-gray-50 dark:bg-zinc-800/80 rounded-lg text-xs font-mono text-gray-700 dark:text-zinc-300 truncate">
                  donkai.app/@vous/projet
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-zinc-400">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Prêt pour WhatsApp</span>
                  <span className="text-gray-400 dark:text-zinc-500">1 clic</span>
                </div>
              </div>
            </div>

            {/* Étape 3 : Recevez */}
            <div className="p-6 rounded-3xl bg-[#faf9f6] dark:bg-[#13151f] border border-gray-200/70 dark:border-zinc-800 flex flex-col justify-between space-y-4 hover:border-orange-200 dark:hover:border-orange-800/60 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-heading">
                    Étape 03
                  </span>
                </div>
                <h3 className="text-lg font-heading font-extrabold text-gray-950 dark:text-white">
                  {t('how.step3_title')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {t('how.step3_desc')}
                </p>
              </div>

              {/* Interface miniature 3 : Notification Mobile Money */}
              <div className="p-3.5 bg-white dark:bg-[#1a1d2c] rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 shadow-2xs space-y-2">
                <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Versement en direct
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold flex justify-between items-center">
                  <span>+25 000 FCFA reçu</span>
                  <span className="text-[10px] uppercase">Wave</span>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Sans création de compte pour le donateur
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE DU PRODUIT EN ACTION (Section 8 du master prompt : Montrer le produit) */}
      <section className="w-full py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight">
              {t('showcase.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t('showcase.subtitle')}
            </p>
          </div>

          {/* Sélecteur d'onglets produit */}
          <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveShowcaseTab('campaign')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeShowcaseTab === 'campaign'
                  ? 'bg-white dark:bg-[#1a1d2c] text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('showcase.tab_campaign')}
            </button>
            <button
              type="button"
              onClick={() => setActiveShowcaseTab('dashboard')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeShowcaseTab === 'dashboard'
                  ? 'bg-white dark:bg-[#1a1d2c] text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('showcase.tab_dashboard')}
            </button>
            <button
              type="button"
              onClick={() => setActiveShowcaseTab('profile')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeShowcaseTab === 'profile'
                  ? 'bg-white dark:bg-[#1a1d2c] text-gray-950 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('showcase.tab_profile')}
            </button>
          </div>

          {/* Contenu visuel selon l'onglet actif */}
          <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-md p-6 sm:p-8 text-left max-w-3xl mx-auto">
            {activeShowcaseTab === 'campaign' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold font-heading">
                      KA
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-950 dark:text-white font-heading">
                        Forage solaire et eau potable pour Gao
                      </h4>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Organisé par Kalifa Coulibaly</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                    Actif
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#181b29] border border-gray-200/60 dark:border-zinc-700/60 space-y-2">
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-bold uppercase">Expérience Donateur</span>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <span className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-center font-bold text-xs text-gray-900 dark:text-zinc-100">
                        1 000 F
                      </span>
                      <span className="p-2 rounded-lg bg-orange-500 text-white text-center font-bold text-xs shadow-2xs">
                        2 500 F
                      </span>
                      <span className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-center font-bold text-xs text-gray-900 dark:text-zinc-100">
                        5 000 F
                      </span>
                      <span className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-center font-bold text-xs text-gray-900 dark:text-zinc-100">
                        10 000 F
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 pt-1">
                      Paiement en 1 clic par Orange Money, Wave ou Moov Money.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#faf9f6] dark:bg-[#181b29] border border-gray-200/60 dark:border-zinc-700/60 space-y-2">
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-bold uppercase">Expérience donateur fluide</span>
                    <div className="space-y-1 text-xs pt-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-zinc-400">Montant choisi</span>
                        <strong className="text-gray-900 dark:text-zinc-100">2 500 FCFA</strong>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Frais donateur</span>
                        <span>0 FCFA (Gratuit)</span>
                      </div>
                      <div className="flex justify-between text-gray-700 dark:text-zinc-300 font-medium pt-1 border-t border-gray-200 dark:border-zinc-700">
                        <span>Validation</span>
                        <span>Instantanée par USSD / SMS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/40 space-y-1">
                    <span className="text-[11px] text-orange-900 dark:text-orange-300 font-bold uppercase">Solde disponible</span>
                    <p className="text-xl font-heading font-extrabold text-orange-600 dark:text-orange-400">
                      420 000 FCFA
                    </p>
                    <span className="text-[10px] text-orange-800 dark:text-orange-300/80">Prêt pour versement</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181b29] border border-gray-200/70 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-bold uppercase">Total collecté (net)</span>
                    <p className="text-xl font-heading font-extrabold text-gray-950 dark:text-white">
                      931 000 FCFA
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">64 soutiens</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181b29] border border-gray-200/70 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-bold uppercase">Sécurité retrait</span>
                    <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1 mt-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Verrouillé 30j</span>
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">Numéro protégé</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-[#181b29] rounded-2xl border border-gray-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-gray-900 dark:text-zinc-100">Retrait instantané sur Mobile Money</strong>
                    <p className="text-gray-500 dark:text-zinc-400 text-[11px]">Compte de réception : Orange Money (+223 70 00 00 00)</p>
                  </div>
                  <span className="bg-gray-900 dark:bg-zinc-800 text-white px-3 py-1.5 rounded-xl font-bold text-[11px]">
                    0 FCFA de frais au retrait
                  </span>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'profile' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-heading font-extrabold text-lg shadow-sm">
                    KC
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
                        Kalifa Coulibaly
                      </h4>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Identité vérifiée</span>
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-mono">@kalifa</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      Porteur de projets d'accès à l'eau potable et d'infrastructures locales au Mali.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex gap-4 text-xs text-gray-500 dark:text-zinc-400">
                  <div>
                    <strong className="text-sm font-heading font-extrabold text-gray-900 dark:text-white mr-1">2</strong>
                    collectes actives
                  </div>
                  <div>
                    <strong className="text-sm font-heading font-extrabold text-emerald-600 dark:text-emerald-400 mr-1">
                      1 450 000 FCFA
                    </strong>
                    mobilisés
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. MOYENS DE PAIEMENT LOCAUX RÉELS & TRANSPARENCE DES FRAIS */}
      <section className="w-full bg-white dark:bg-[#0c0d12] py-20 px-4 sm:px-6 border-y border-gray-100 dark:border-zinc-800 transition-colors">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight">
              {t('payment.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t('payment.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {/* Orange Money */}
            <div className="p-6 rounded-3xl bg-[#faf9f6] dark:bg-[#13151f] border border-gray-200/70 dark:border-zinc-800 text-center space-y-3 hover:border-orange-300 dark:hover:border-orange-800 transition-colors">
              <div className="h-12 flex items-center justify-center mx-auto">
                <img src="/icons/orange-money.svg" alt="Orange Money" className="h-10 w-auto object-contain" />
              </div>
              <h4 className="font-heading font-extrabold text-gray-950 dark:text-white text-base">Orange Money</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Mali, Sénégal, Côte d'Ivoire, Guinée</p>
              <span className="inline-block text-[11px] font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full">
                Instantané
              </span>
            </div>

            {/* Wave */}
            <div className="p-6 rounded-3xl bg-[#faf9f6] dark:bg-[#13151f] border border-gray-200/70 dark:border-zinc-800 text-center space-y-3 hover:border-sky-300 dark:hover:border-sky-800 transition-colors">
              <div className="h-12 flex items-center justify-center mx-auto">
                <img src="/icons/wave.png" alt="Wave" className="h-10 w-auto object-contain" />
              </div>
              <h4 className="font-heading font-extrabold text-gray-950 dark:text-white text-base">Wave</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Mali, Sénégal, Côte d'Ivoire</p>
              <span className="inline-block text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-0.5 rounded-full">
                Sans frais donateur
              </span>
            </div>

            {/* Moov Money */}
            <div className="p-6 rounded-3xl bg-[#faf9f6] dark:bg-[#13151f] border border-gray-200/70 dark:border-zinc-800 text-center space-y-3 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
              <div className="h-12 flex items-center justify-center mx-auto">
                <img src="/icons/moov-money.png" alt="Moov Money" className="h-10 w-auto object-contain" />
              </div>
              <h4 className="font-heading font-extrabold text-gray-950 dark:text-white text-base">Moov Money</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Mali, Bénin, Togo, Côte d'Ivoire</p>
              <span className="inline-block text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                Disponible 24/7
              </span>
            </div>
          </div>

          {/* Grille d'avantages clés (Règle scan 5s : chiffres avant texte) */}
          <div className="max-w-2xl mx-auto p-5 rounded-3xl bg-gray-50 dark:bg-[#13151f] border border-gray-200/80 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xl font-heading font-extrabold text-gray-950 dark:text-white">0 FCFA</span>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Pour créer votre collecte</p>
            </div>
            <div className="border-y sm:border-y-0 sm:border-x border-gray-200 dark:border-zinc-800 py-2 sm:py-0">
              <span className="text-xl font-heading font-extrabold text-orange-600 dark:text-orange-400">10 sec</span>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Pour soutenir sans créer de compte</p>
            </div>
            <div>
              <span className="text-xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400">0 FCFA</span>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Frais donateur sur tout paiement</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. POUR QUI ? (Cartes visuelles avec tags et exemples concrets) */}
      <section className="w-full py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight">
              {t('audience.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400">
              {t('audience.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
            <div className="p-7 bg-white dark:bg-[#13151f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs space-y-3 hover:border-orange-200 dark:hover:border-orange-800/60 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-heading font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                  <span>{t('audience.creators')}</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Vidéos & Directs</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                {t('audience.creators_desc')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Podcasts</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Matériel vidéo</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Directs TikTok/YT</span>
              </div>
            </div>

            <div className="p-7 bg-white dark:bg-[#13151f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs space-y-3 hover:border-orange-200 dark:hover:border-orange-800/60 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-heading font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span>{t('audience.artists')}</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Culture & Musique</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                {t('audience.artists_desc')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Albums</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Clips musicaux</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Expositions</span>
              </div>
            </div>

            <div className="p-7 bg-white dark:bg-[#13151f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs space-y-3 hover:border-orange-200 dark:hover:border-orange-800/60 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-heading font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>{t('audience.associations')}</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Solidarité</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                {t('audience.associations_desc')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Santé</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Éducation</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Kits scolaires</span>
              </div>
            </div>

            <div className="p-7 bg-white dark:bg-[#13151f] rounded-3xl border border-orange-100/70 dark:border-zinc-800 shadow-xs space-y-3 hover:border-orange-200 dark:hover:border-orange-800/60 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-heading font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>{t('audience.projects')}</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Quartiers & Villages</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                {t('audience.projects_desc')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Forages solaires</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Rénovation lieux</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full">Événements</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SÉCURITÉ & CONFIANCE (3 piliers visuels sans fausse promesse) */}
      <section className="w-full bg-white dark:bg-[#0c0d12] py-20 px-4 sm:px-6 border-y border-gray-100 dark:border-zinc-800 transition-colors">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div className="space-y-2 max-w-xl mx-auto">
            <div className="w-10 h-10 rounded-2xl bg-gray-950 dark:bg-zinc-800 text-white flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight">
              {t('security.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className="p-6 bg-[#faf9f6] dark:bg-[#13151f] rounded-3xl border border-gray-200/70 dark:border-zinc-800 space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-extrabold text-gray-950 dark:text-white text-sm">
                Verrouillage 30 jours
              </h4>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Tout changement de numéro de retrait bloque les modifications suivantes pendant 30 jours pour protéger vos fonds contre le piratage.
              </p>
            </div>

            <div className="p-6 bg-[#faf9f6] dark:bg-[#13151f] rounded-3xl border border-gray-200/70 dark:border-zinc-800 space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-extrabold text-gray-950 dark:text-white text-sm">
                Vérification KYC (500k)
              </h4>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Dès 500 000 FCFA mobilisés, une vérification d'identité est déclenchée pour garantir que l'argent parvient au bénéficiaire légitime.
              </p>
            </div>

            <div className="p-6 bg-[#faf9f6] dark:bg-[#13151f] rounded-3xl border border-gray-200/70 dark:border-zinc-800 space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-heading font-extrabold text-gray-950 dark:text-white text-sm">
                Modération active 24h
              </h4>
              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                Tout signalement communautaire (3 rapports) entraîne un examen immédiat et une suspension préventive des versements en cas d'anomalie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ — SEO + LISIBILITÉ (Sections 11 à 14 du master prompt) */}
      <section id="faq" className="w-full py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight">
              {t('faq.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="space-y-3 text-left">
            {faqList.map((item, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-[#13151f] rounded-2xl border border-gray-200/80 dark:border-zinc-800 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-heading font-extrabold text-gray-950 dark:text-white text-sm sm:text-base">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 dark:text-zinc-400 transition-transform shrink-0 ${
                        isOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-zinc-800 text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
                      <strong className="text-gray-950 dark:text-white font-bold">
                        {item.highlight}
                      </strong>
                      <span>{item.answer}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 8. CTA FINAL (Section 10 : Unique, clair, sans distraction) */}
      <section className="w-full bg-gradient-to-b from-[#faf9f6] to-white dark:from-[#0c0d12] dark:to-[#13151f] py-20 px-4 sm:px-6 border-t border-gray-100 dark:border-zinc-800 text-center transition-colors">
        <div className="max-w-xl mx-auto space-y-5">
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-950 dark:text-white tracking-tight">
            {t('cta_final.title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-300 leading-relaxed">
            {t('cta_final.desc')}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/create')}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-orange-500/25 transition-all text-sm sm:text-base cursor-pointer"
            >
              <span>{t('cta_final.button')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
