import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from '../components/Icons'
import { ImageUploadField } from '../components/ImageUploadField'

interface CreateCampaignPageProps {
  onNavigate: (path: string) => void
}

const CATEGORIES = [
  'Solidarité & Entraide',
  'Santé & Urgence médicale',
  'Eau & Infrastructure',
  'Éducation & Enfance',
  'Projet Communautaire',
  'Culture & Création',
]

const QUICK_GOALS = [250000, 500000, 1000000, 2500000]

export const CreateCampaignPage: React.FC<CreateCampaignPageProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth()

  // Wizard étape (1: Projet, 2: Objectif & Bénéficiaire, 3: KYC & Publication)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Étape 1 : Le Projet
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  // Étape 2 : Objectif & Bénéficiaire
  const [goalAmount, setGoalAmount] = useState<number | ''>(500000)
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  })
  const [beneficiaryType, setBeneficiaryType] = useState<'self' | 'other'>('self')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('')

  // Étape 3 : KYC express (obligatoire pour créer une collecte)
  const [docType, setDocType] = useState('cni')
  const [docNumber, setDocNumber] = useState('')
  const [payoutNumber, setPayoutNumber] = useState(profile?.wallet_number || '')
  const [payoutProvider, setPayoutProvider] = useState<'orange' | 'wave' | 'moov'>(
    (profile?.wallet_provider as any) || 'orange'
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/login')
    }
  }, [user, authLoading, onNavigate])

  useEffect(() => {
    if (profile?.wallet_number && !payoutNumber) {
      setPayoutNumber(profile.wallet_number)
    }
    if (profile?.wallet_provider) {
      setPayoutProvider(profile.wallet_provider as any)
    }
  }, [profile])

  // Génération automatique d'un slug propre
  const handleTitleChange = (val: string) => {
    setTitle(val)
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 48)
    setSlug(generatedSlug)
  }

  const formatFcfa = (val: number): string => {
    return (val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Validation étape 1
  const handleGoToStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim() || title.trim().length < 5) {
      setError('Veuillez donner un titre clair à votre collecte (au moins 5 caractères).')
      return
    }
    if (!description.trim() || description.trim().length < 20) {
      setError('Veuillez décrire le projet avec plus de précision (au moins 20 caractères).')
      return
    }
    setCurrentStep(2)
  }

  // Validation étape 2
  const handleGoToStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const numGoal = Number(goalAmount)
    if (!numGoal || numGoal < 1000) {
      setError('L’objectif financier minimal est de 1 000 FCFA.')
      return
    }

    const chosenDate = new Date(endDate).getTime()
    const maxDate = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000
    if (chosenDate > maxDate) {
      setError('La durée d’une collecte ne peut pas excéder 2 ans.')
      return
    }

    if (beneficiaryType === 'other' && (!beneficiaryName.trim() || !beneficiaryPhone.trim())) {
      setError('Veuillez indiquer le nom et le numéro WhatsApp / Mobile Money du bénéficiaire désigné.')
      return
    }

    setCurrentStep(3)
  }

  // Lancement final de la collecte (Étape 3 avec KYC obligatoire)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      onNavigate('/login')
      return
    }

    // Si l'utilisateur n'est pas encore vérifié, la saisie KYC est obligatoire
    const isAlreadyVerified = profile?.verification_status === 'verified'
    if (!isAlreadyVerified && !docNumber.trim()) {
      setError('Le numéro de votre pièce d’identité (CNI / Passeport) est requis pour valider votre collecte.')
      return
    }

    if (!payoutNumber.trim()) {
      setError('Le numéro de réception Mobile Money est obligatoire pour percevoir les dons.')
      return
    }

    setSubmitting(true)

    try {
      // 1. Déterminer l'ID du profil Supabase
      let userId = profile?.id
      let currentUsername = profile?.username

      if (!userId) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('clerk_user_id', user.id)
          .maybeSingle()

        if (profData) {
          userId = profData.id
          currentUsername = profData.username
        } else {
          // Création express du profil s'il n'existait pas encore
          const cleanUsername =
            user.fullName?.toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${Date.now()}`
          const { data: newProf, error: profErr } = await supabase
            .from('profiles')
            .insert({
              clerk_user_id: user.id,
              username: cleanUsername,
              display_name: user.fullName || 'Organisateur Donkai',
              email: user.email,
              wallet_number: payoutNumber.trim(),
              wallet_provider: payoutProvider,
              verification_status: 'verified', // validé par saisie pièce d'identité
            })
            .select('id, username')
            .single()

          if (profErr || !newProf) {
            throw new Error(profErr?.message || 'Erreur lors de la configuration du profil.')
          }
          userId = newProf.id
          currentUsername = newProf.username
        }
      }

      // 2. Mettre à jour les informations KYC et wallet du profil
      await supabase
        .from('profiles')
        .update({
          wallet_number: payoutNumber.trim(),
          wallet_provider: payoutProvider,
          verification_status: 'verified',
        })
        .eq('id', userId)

      // Enregistrer l'enregistrement KYC dans verification_records
      if (docNumber.trim()) {
        await supabase.from('verification_records').insert({
          user_id: userId,
          document_type: docType,
          document_number: docNumber.trim(),
          status: 'verified',
        })
      }

      // 3. Créer la collecte en base de données
      const cleanSlug = slug.trim() || `collecte-${Date.now().toString().slice(-4)}`
      const numGoal = Number(goalAmount) || 500000

      const { data: newCampaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({
          user_id: userId,
          title: title.trim(),
          slug: cleanSlug,
          description: description.trim(),
          cover_image_url: coverImageUrl || null,
          goal_amount: numGoal,
          currency: 'XOF',
          status: 'active',
          end_date: new Date(endDate).toISOString(),
          beneficiary_type: beneficiaryType,
          beneficiary_name: beneficiaryType === 'other' ? beneficiaryName.trim() : null,
          beneficiary_phone: beneficiaryType === 'other' ? beneficiaryPhone.trim() : null,
        })
        .select('id, slug')
        .single()

      if (campErr) {
        throw new Error(campErr.message || 'Erreur lors de la publication de la collecte.')
      }

      await refreshProfile()

      // Redirection immédiate vers la page publique de la collecte créée
      onNavigate(`/@${currentUsername || 'me'}/${newCampaign.slug}`)
    } catch (err) {
      console.error('Erreur création collecte:', err)
      setError((err as Error).message || 'Une erreur est survenue lors de la publication.')
      setSubmitting(false)
    }
  }

  const usernameDisplay = profile?.username || user?.fullName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'votre-nom'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      {/* En-tête Wizard */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Lancement de collecte</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
          Créer votre collecte communautaire
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-lg mx-auto">
          Collectez facilement des fonds via Orange Money, Wave et Moov Money en quelques étapes rapides.
        </p>
      </div>

      {/* Barre de progression Wizard */}
      <div className="bg-white dark:bg-[#12131a] rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-zinc-800 shadow-xs">
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
          {/* Étape 1 */}
          <div
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className={`flex items-center justify-center gap-2 p-2 rounded-xl transition-colors ${
              currentStep === 1
                ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                : currentStep > 1
                ? 'text-gray-700 dark:text-zinc-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800'
                : 'text-gray-400 dark:text-zinc-600'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[11px] flex items-center justify-center">
              1
            </span>
            <span className="hidden sm:inline">Le Projet</span>
          </div>

          {/* Étape 2 */}
          <div
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className={`flex items-center justify-center gap-2 p-2 rounded-xl transition-colors ${
              currentStep === 2
                ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                : currentStep > 2
                ? 'text-gray-700 dark:text-zinc-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800'
                : 'text-gray-400 dark:text-zinc-600'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'
              }`}
            >
              2
            </span>
            <span className="hidden sm:inline">Objectif & Bénéficiaire</span>
          </div>

          {/* Étape 3 */}
          <div
            className={`flex items-center justify-center gap-2 p-2 rounded-xl transition-colors ${
              currentStep === 3
                ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                : 'text-gray-400 dark:text-zinc-600'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${
                currentStep === 3 ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'
              }`}
            >
              3
            </span>
            <span className="hidden sm:inline">Sécurité & Lancement</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-3 text-xs text-red-700 dark:text-red-300 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1 font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* CONTENU DU WIZARD */}
      <div className="bg-white dark:bg-[#12131a] rounded-3xl p-6 sm:p-9 border border-gray-100 dark:border-zinc-800/80 shadow-xl shadow-orange-950/5">
        {/* ÉTAPE 1 : LE PROJET */}
        {currentStep === 1 && (
          <form onSubmit={handleGoToStep2} className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-gray-950 dark:text-white">
                Étape 1 : Présentation de votre projet
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Donnez envie à votre communauté de se mobiliser pour votre cause.
              </p>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
                Titre de votre collecte *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Forage d'eau potable pour le village de Gao"
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
                Catégorie du projet
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      category === cat
                        ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 text-gray-700 dark:text-zinc-300 hover:border-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
                Histoire et objectif de la collecte *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expliquez en détail pourquoi cette initiative est importante, à quoi serviront les fonds collectés et qui en bénéficiera..."
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-3 px-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600 resize-none leading-relaxed"
              />
            </div>

            {/* Photo ou Affiche de la collecte */}
            <div>
              <ImageUploadField
                label="Affiche ou Photo du projet"
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                aspectRatio="banner"
                maxDimension={1200}
                quality={0.82}
                helperText={
                  [
                    'Solidarité & Entraide',
                    'Santé & Urgence médicale',
                    'Eau & Infrastructure',
                    'Éducation & Enfance',
                    'Projet Communautaire',
                  ].includes(category)
                    ? "Exigence d'authenticité (Associations & Causes) : Fournissez une vraie photo de terrain ou de votre structure. Les images générées par IA sont proscrites sur les causes humanitaires car elles éveillent la méfiance des donateurs."
                    : "Pour les créateurs & projets culturels : Vous pouvez importer votre affiche officielle, pochette, visuel conceptuel ou photo d'équipe (les visuels graphiques sont acceptés)."
                }
              />
            </div>

            {/* Aperçu de l'URL publique */}
            <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 text-xs">
              <span className="text-gray-400 dark:text-zinc-500 font-bold block mb-1">
                Lien public dédié de votre collecte :
              </span>
              <span className="font-mono text-orange-600 dark:text-orange-400 font-bold break-all">
                https://donkai.app/@{usernameDisplay}/{slug || 'votre-slug'}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-heading font-bold py-3 px-7 rounded-2xl transition-all shadow-md shadow-orange-600/20 cursor-pointer text-sm"
              >
                <span>Étape suivante : Objectif</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 2 : OBJECTIF & BÉNÉFICIAIRE */}
        {currentStep === 2 && (
          <form onSubmit={handleGoToStep3} className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-gray-950 dark:text-white">
                Étape 2 : Objectif financier & Bénéficiaire
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Définissez le montant cible en FCFA et désignez qui recevra les fonds.
              </p>
            </div>

            {/* Montant Cible */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                Montant cible à collecter (FCFA) *
              </label>

              {/* Suggestions rapides */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {QUICK_GOALS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setGoalAmount(q)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      goalAmount === q
                        ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                        : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-gray-800 dark:text-zinc-200'
                    }`}
                  >
                    {formatFcfa(q)}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Montant cible en FCFA..."
                  className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-3 pl-4 pr-16 text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30 focus:border-orange-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-zinc-500">
                  FCFA
                </span>
              </div>
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
                Date de fin de la collecte (optionnel, max 2 ans)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-2.5 px-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30"
              />
            </div>

            {/* Bénéficiaire désigné */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                À qui sont destinés les fonds collectés ?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBeneficiaryType('self')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    beneficiaryType === 'self'
                      ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/40 shadow-xs'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:bg-gray-50'
                  }`}
                >
                  <strong className="block text-xs font-bold text-gray-950 dark:text-white">
                    Pour moi-même
                  </strong>
                  <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 block">
                    Les fonds seront versés directement sur mon numéro Mobile Money.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBeneficiaryType('other')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    beneficiaryType === 'other'
                      ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/40 shadow-xs'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:bg-gray-50'
                  }`}
                >
                  <strong className="block text-xs font-bold text-gray-950 dark:text-white">
                    Pour une autre personne ou cause
                  </strong>
                  <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 block">
                    Pour un proche, une famille ou une communauté dans le besoin.
                  </span>
                </button>
              </div>

              {beneficiaryType === 'other' && (
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Nom complet du bénéficiaire *
                    </label>
                    <input
                      type="text"
                      required
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="Ex: Famille Diallo"
                      className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Numéro WhatsApp ou Mobile Money du bénéficiaire *
                    </label>
                    <input
                      type="tel"
                      required
                      value={beneficiaryPhone}
                      onChange={(e) => setBeneficiaryPhone(e.target.value)}
                      placeholder="+223 70 00 00 00"
                      className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-heading font-bold py-3 px-7 rounded-2xl transition-all shadow-md shadow-orange-600/20 cursor-pointer text-sm"
              >
                <span>Étape suivante : Sécurité KYC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 3 : CONTRÔLE KYC & PUBLICATION OFFICIELLE */}
        {currentStep === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-gray-950 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Étape 3 : Contrôle de sécurité & Lancement</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Conformément aux règles de sécurité DONKAI, la vérification d'identité est obligatoire avant de publier une collecte.
              </p>
            </div>

            {/* Récapitulatif du projet */}
            <div className="p-4 bg-orange-50/60 dark:bg-orange-950/30 rounded-2xl border border-orange-200/70 dark:border-orange-900/40 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-400 font-medium">Titre de la collecte :</span>
                <strong className="text-gray-900 dark:text-white text-right max-w-xs">{title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-400 font-medium">Objectif financier :</span>
                <strong className="text-orange-600 dark:text-orange-400 font-bold">{formatFcfa(Number(goalAmount) || 0)} FCFA</strong>
              </div>
            </div>

            {/* Coordonnées de versement Mobile Money */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                Numéro Mobile Money de réception des fonds *
              </label>

              {/* Sélection opérateur avec vrais logos */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutProvider('orange')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    payoutProvider === 'orange'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50'
                  }`}
                >
                  <img src="/icons/orange-money.svg" alt="Orange" className="h-4 w-auto" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Orange</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutProvider('wave')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    payoutProvider === 'wave'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50'
                  }`}
                >
                  <img src="/icons/wave.png" alt="Wave" className="h-4 w-auto" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Wave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutProvider('moov')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    payoutProvider === 'moov'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50'
                  }`}
                >
                  <img src="/icons/moov-money.png" alt="Moov" className="h-4 w-auto" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Moov</span>
                </button>
              </div>

              <input
                type="tel"
                required
                value={payoutNumber}
                onChange={(e) => setPayoutNumber(e.target.value)}
                placeholder="Numéro Mobile Money (Ex: +223 70 00 00 00)"
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-2.5 px-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30"
              />
            </div>

            {/* Vérification KYC : CNI / Passeport */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                Pièce d'identité officielle du porteur de projet *
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType('cni')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    docType === 'cni'
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  CNI / NINA
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('passeport')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    docType === 'passeport'
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  Passeport
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('permis')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    docType === 'permis'
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  Permis
                </button>
              </div>

              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Numéro du document d'identité officiel..."
                className="w-full bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl py-2.5 px-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-600/30"
              />
              <span className="text-[11px] text-gray-400 dark:text-zinc-500 block leading-tight">
                Vos données sont strictement cryptées et traitées selon les normes de conformité anti-fraude d'Oshun Web Studio.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-heading font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-orange-600/20 cursor-pointer text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Création et publication...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publier ma collecte en direct</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
