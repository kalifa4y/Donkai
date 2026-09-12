import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
  Info,
  ShieldCheck,
} from '../components/Icons'

interface CreateCampaignPageProps {
  onNavigate: (path: string) => void
}

export const CreateCampaignPage: React.FC<CreateCampaignPageProps> = ({ onNavigate }) => {
  const { user, profile, loading: authLoading } = useAuth()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [goalAmount, setGoalAmount] = useState<number | ''>(500000)
  const [endDate, setEndDate] = useState<string>(() => {
    // Par défaut 60 jours dans le futur (durée max 2 ans)
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  })

  // Gestion du bénéficiaire (soi-même ou un tiers)
  const [beneficiaryType, setBeneficiaryType] = useState<'self' | 'other'>('self')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('')
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/login')
    }
  }, [user, authLoading, onNavigate])

  // Génération automatique d'un slug propre à partir du titre
  const handleTitleChange = (val: string) => {
    setTitle(val)
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime les accents
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 48)
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      onNavigate('/login')
      return
    }

    if (!title.trim()) {
      setError('Veuillez donner un titre clair à votre collecte.')
      return
    }

    const cleanSlug = slug.trim() || 'collecte'
    const numGoal = Number(goalAmount)
    if (!numGoal || numGoal < 1000) {
      setError('L’objectif financier minimal est de 1 000 FCFA.')
      return
    }

    // Vérification durée maximale 2 ans
    const chosenDate = new Date(endDate).getTime()
    const maxDate = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000
    if (chosenDate > maxDate) {
      setError('La durée d’une collecte ne peut pas excéder 2 ans.')
      return
    }

    if (beneficiaryType === 'other' && (!beneficiaryName.trim() || !beneficiaryPhone.trim())) {
      setError('Veuillez indiquer le nom et le numéro du bénéficiaire désigné.')
      return
    }

    setSubmitting(true)

    try {
      // 1. Déterminer l'user_id profil
      let userId = profile?.id
      if (!userId) {
        // Si le profil n'est pas encore synchronisé en base, le créer ou chercher
        const { data: profData } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', user.id)
          .maybeSingle()

        if (profData) {
          userId = profData.id
        } else {
          // Insertion de base de secours
          const { data: newProf, error: profErr } = await supabase
            .from('profiles')
            .insert({
              clerk_user_id: user.id,
              username: user.fullName?.toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${Date.now()}`,
              display_name: user.fullName || 'Organisateur Donkai',
              email: user.email,
            })
            .select('id, username')
            .single()

          if (!profErr && newProf) {
            userId = newProf.id
          }
        }
      }

      const campaignPayload = {
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        title: title.trim(),
        slug: cleanSlug,
        description: description.trim(),
        goal_amount: numGoal,
        collected_amount: 0,
        contributions_count: 0,
        currency: 'XOF',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(endDate).toISOString(),
        beneficiary_type: beneficiaryType,
        beneficiary_name: beneficiaryType === 'other' ? beneficiaryName.trim() : null,
        beneficiary_email: beneficiaryType === 'other' ? beneficiaryEmail.trim() : null,
        beneficiary_phone: beneficiaryType === 'other' ? beneficiaryPhone.trim() : null,
        beneficiary_claimed: beneficiaryType === 'self',
      }

      const { error: insertError } = await supabase
        .from('campaigns')
        .insert(campaignPayload)
        .select('*')
        .single()

      if (insertError) {
        // Enregistrement local de secours
        const userUsername = profile?.username || user.fullName || 'organisateur'
        const localCampaigns = JSON.parse(localStorage.getItem('donkai_local_campaigns') || '[]')
        localCampaigns.unshift({
          ...campaignPayload,
          id: `local_camp_${Date.now()}`,
        })
        localStorage.setItem('donkai_local_campaigns', JSON.stringify(localCampaigns))

        onNavigate(`/@${userUsername}/${cleanSlug}`)
        return
      }

      const targetUsername = profile?.username || 'mon-profil'
      onNavigate(`/@${targetUsername}/${cleanSlug}`)
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la création de la collecte.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8 text-left">
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200/60 text-xs font-bold mb-3">
          <Target className="w-3.5 h-3.5 text-orange-600" />
          <span>Nouvelle collecte d'objectifs</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
          Lancez votre collecte
        </h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Définissez votre projet, votre objectif et commencez à recevoir le soutien direct de votre communauté.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre & Slug */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-orange-100/80 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-gray-950 pb-2 border-b border-gray-100">
            1. Présentation de la collecte
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Titre clair de votre objectif *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Financement d’un forage d’eau potable pour Gao"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Lien dédié de votre collecte (URL) *
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden text-xs font-mono bg-gray-50">
              <span className="px-3 py-3 text-gray-500 border-r border-gray-200 shrink-0">
                donkai.app/@{profile?.username || 'votre-nom'}/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 bg-white px-3 py-3 text-gray-900 font-bold outline-none"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Cette URL unique sera partagée sur vos réseaux sociaux (TikTok, WhatsApp, etc.).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description complète de votre projet *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Expliquez pourquoi ce projet est important, comment les fonds seront utilisés, et quel sera l’impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Objectif & Durée */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-orange-100/80 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-gray-950 pb-2 border-b border-gray-100">
            2. Objectif financier & Calendrier
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Montant recherché (FCFA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  FCFA
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Date de fin (max. 2 ans) *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Frais Donkai affichés clairement à la création selon section 6 du prompt */}
          <div className="p-4 bg-orange-50/60 border border-orange-200/70 rounded-2xl flex items-start gap-3">
            <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-900 space-y-1">
              <p className="font-bold">Tarification transparente validée :</p>
              <p>
                <strong>5 % + 100 FCFA</strong> sont prélevés par contribution et déduits du montant reçu par le bénéficiaire. <strong>Aucun frais supplémentaire</strong> n'est appliqué lors du retrait des fonds.
              </p>
            </div>
          </div>
        </div>

        {/* Choix du bénéficiaire */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-orange-100/80 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-gray-950 pb-2 border-b border-gray-100">
            3. Bénéficiaire des fonds
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBeneficiaryType('self')}
              className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                beneficiaryType === 'self'
                  ? 'border-orange-500 bg-orange-50/50 text-orange-950 ring-2 ring-orange-500'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <span>Pour moi-même</span>
              <span className="text-[10px] text-gray-500 font-normal">Vous recevrez les fonds</span>
            </button>

            <button
              type="button"
              onClick={() => setBeneficiaryType('other')}
              className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                beneficiaryType === 'other'
                  ? 'border-orange-500 bg-orange-50/50 text-orange-950 ring-2 ring-orange-500'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
              }`}
            >
              <Users className="w-5 h-5 text-orange-600" />
              <span>Pour un tiers / Association</span>
              <span className="text-[10px] text-gray-500 font-normal">Fonds versés au bénéficiaire</span>
            </button>
          </div>

          {beneficiaryType === 'other' && (
            <div className="space-y-3 pt-2">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                Une invitation sera transmise au bénéficiaire pour revendiquer et vérifier ses informations de réception. En tant qu'organisateur, vous ne pourrez pas détourner les fonds qui lui sont destinés.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nom complet du bénéficiaire ou de l’organisation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Association Solidarité Tombouctou"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Numéro de téléphone Mobile Money *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+223 70 00 00 00"
                    value={beneficiaryPhone}
                    onChange={(e) => setBeneficiaryPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Adresse email du bénéficiaire
                  </label>
                  <input
                    type="email"
                    placeholder="contact@association.org"
                    value={beneficiaryEmail}
                    onChange={(e) => setBeneficiaryEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Création de votre collecte...</span>
            </>
          ) : (
            <>
              <span>Publier et activer ma collecte</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
