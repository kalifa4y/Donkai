import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Profile, WalletProvider } from '../types'
import {
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  User,
  Users,
  Building2,
  Sparkles,
  Info,
  Lock,
} from '../components/Icons'

interface OnboardingPageProps {
  onNavigate: (path: string) => void
}

type AccountType = 'individual' | 'association' | 'creator' | 'business'

const ACCOUNT_TYPES: { id: AccountType; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  {
    id: 'individual',
    label: 'Particulier',
    desc: 'Projet personnel, entraide familiale, santé ou étude',
    icon: User,
  },
  {
    id: 'association',
    label: 'Association / ONG',
    desc: 'Initiative communautaire, caritative ou humanitaire',
    icon: Users,
  },
  {
    id: 'creator',
    label: 'Créateur / Artiste',
    desc: 'Contenu culturel, musique, vidéo, documentaire',
    icon: Sparkles,
  },
  {
    id: 'business',
    label: 'Entreprise / Startup',
    desc: 'Projet entrepreneurial, pré-commandes ou amorçage',
    icon: Building2,
  },
]

const OPERATORS: { id: WalletProvider; name: string; logo: string; color: string; placeholder: string }[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    logo: '/icons/orange-money.svg',
    color: 'hover:border-[#FF7900] dark:hover:border-[#FF7900]',
    placeholder: 'Ex: +223 70 00 00 00 (Orange Mali)',
  },
  {
    id: 'wave',
    name: 'Wave',
    logo: '/icons/wave.png',
    color: 'hover:border-[#1BA7FE] dark:hover:border-[#1BA7FE]',
    placeholder: 'Ex: +223 76 00 00 00 (Wave Mali)',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    logo: '/icons/moov-money.png',
    color: 'hover:border-[#005CA9] dark:hover:border-[#005CA9]',
    placeholder: 'Ex: +223 60 00 00 00 (Moov Mali)',
  },
]

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, setProfileState } = useAuth()

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Étape 1 : Rôle & Profil
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const requestIdRef = useRef(0)

  // Étape 2 : Contact & Retrait Multi-Opérateurs
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [walletProvider, setWalletProvider] = useState<WalletProvider>('orange')
  const [wallets, setWallets] = useState<Record<WalletProvider, string>>(() => {
    const initial: Record<WalletProvider, string> = { orange: '', wave: '', moov: '', mtn: '' }
    if (user?.id) {
      try {
        const cached = localStorage.getItem(`donkai_profile_${user.id}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.wallets && typeof parsed.wallets === 'object') {
            return { ...initial, ...parsed.wallets }
          }
          if (parsed.wallet_provider && parsed.wallet_number) {
            initial[parsed.wallet_provider as WalletProvider] = parsed.wallet_number
          }
        }
      } catch {}
    }
    return initial
  })

  // Synchronisation si le profil existant a déjà un portefeuille configuré
  useEffect(() => {
    if (profile?.wallet_provider && profile?.wallet_number) {
      setWallets((prev) => {
        if (!prev[profile.wallet_provider as WalletProvider]) {
          return {
            ...prev,
            [profile.wallet_provider as WalletProvider]: profile.wallet_number,
          }
        }
        return prev
      })
      setWalletProvider(profile.wallet_provider as WalletProvider)
    }
  }, [profile])

  const handleWalletNumberChange = (val: string) => {
    setWallets((prev) => ({
      ...prev,
      [walletProvider]: val,
    }))
  }

  // Étape 3 : KYC (Optionnel au setup, obligatoire avant premier retrait)
  const [docType, setDocType] = useState<'cni' | 'passport' | 'nina'>('cni')
  const [docNumber, setDocNumber] = useState('')

  // États de chargement découplés pour éliminer tout blocage ou spinner infini
  const [submitting, setSubmitting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      onNavigate('/login')
    } else if (profile?.username) {
      onNavigate('/dashboard')
    } else if (user?.fullName && !displayName) {
      setDisplayName(user.fullName)
    }
  }, [user, profile, displayName, onNavigate])

  // Vérification de la disponibilité du nom d'utilisateur (avec watchdog 2s & annulation requêtes obsolètes)
  useEffect(() => {
    const cleaned = username.toLowerCase().trim()
    if (cleaned.length < 3) {
      setUsernameAvailable(null)
      setCheckingUsername(false)
      return
    }

    const currentReqId = ++requestIdRef.current
    setCheckingUsername(true)

    const timer = setTimeout(async () => {
      try {
        const watchdog = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
        const checkQuery = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', cleaned)
            .maybeSingle()
          if (error) return null
          return data
        }

        const result = await Promise.race([checkQuery(), watchdog])

        if (requestIdRef.current === currentReqId) {
          // Si null (aucun enregistrement trouvé ou watchdog expiré), identifiant considéré libre
          setUsernameAvailable(result === null)
        }
      } catch (err) {
        console.warn('Vérification disponibilité identifiant :', err)
        if (requestIdRef.current === currentReqId) {
          setUsernameAvailable(true)
        }
      } finally {
        if (requestIdRef.current === currentReqId) {
          setCheckingUsername(false)
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [username])

  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanUsername = username.toLowerCase().trim()
    if (cleanUsername.length < 3) {
      setError("Le nom d'utilisateur doit comporter au moins 3 caractères.")
      return
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError("Le nom d'utilisateur ne peut contenir que des lettres minuscules, chiffres et underscores (_).")
      return
    }

    if (!displayName.trim()) {
      setError('Veuillez renseigner votre nom complet ou le nom de votre organisation.')
      return
    }

    if (usernameAvailable === false) {
      setError("Cet identifiant est déjà utilisé. Veuillez en choisir un autre.")
      return
    }

    // Si une vérification était encore en cours au moment du clic, validation directe rapide (watchdog 1.5s)
    if (usernameAvailable === null || checkingUsername) {
      try {
        const checkQuery = async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', cleanUsername)
            .maybeSingle()
          return data
        }
        const watchdog = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
        const result = await Promise.race([checkQuery(), watchdog])
        if (result?.id) {
          setUsernameAvailable(false)
          setError("Cet identifiant est déjà utilisé. Veuillez en choisir un autre.")
          return
        }
      } catch {
        // En cas d'erreur de connexion, ne pas bloquer l'utilisateur
      }
    }

    setStep(2)
  }

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const activeNum = (wallets[walletProvider] || '').trim()
    if (!activeNum) {
      const opName = OPERATORS.find((o) => o.id === walletProvider)?.name || walletProvider
      setError(`Le numéro de versement pour ${opName} est obligatoire pour recevoir vos fonds.`)
      return
    }

    setStep(3)
  }

  const handleFinalSubmit = async (skipKyc: boolean = false) => {
    setError(null)
    if (!user) return

    if (skipKyc) {
      setSkipping(true)
    } else {
      setSubmitting(true)
    }

    try {
      const cleanUsername = username.toLowerCase().trim()
      const roleLabel = ACCOUNT_TYPES.find((t) => t.id === accountType)?.label || 'Particulier'
      let finalBio = bio.trim()
      if (whatsappNumber.trim()) {
        const contactTag = `[${roleLabel} | WhatsApp: ${whatsappNumber.trim()}]`
        finalBio = finalBio ? `${contactTag}\n${finalBio}` : contactTag
      }

      const activeWalletNumber = (wallets[walletProvider] || '').trim()

      const profilePayload = {
        clerk_user_id: user.id,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        email: user.email,
        bio: finalBio || null,
        wallet_provider: walletProvider,
        wallet_number: activeWalletNumber,
        wallet_last_updated_at: new Date().toISOString(),
        verification_status: 'unverified',
      }

      // Upsert dans Supabase avec watchdog de 4s pour garantir qu'aucune promesse ne bloque l'UI
      const saveSupabaseProfile = async (): Promise<{ id: string } | null> => {
        try {
          // Vérifier d'abord si le profil existe déjà
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', user.id)
            .maybeSingle()

          if (existing?.id) {
            const { data: updated, error: updateErr } = await supabase
              .from('profiles')
              .update(profilePayload)
              .eq('id', existing.id)
              .select('id')
              .maybeSingle()
            if (updateErr) console.warn('Supabase profile update warning:', updateErr.message)
            return updated || existing
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from('profiles')
              .insert(profilePayload)
              .select('id')
              .maybeSingle()
            if (insertErr) console.warn('Supabase profile insert warning:', insertErr.message)
            return inserted || null
          }
        } catch (dbErr) {
          console.warn('Supabase database access warning:', dbErr)
          return null
        }
      }

      const watchdog = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
      const savedProfile = await Promise.race([saveSupabaseProfile(), watchdog])
      const createdId = savedProfile?.id || user.id

      // 2. Si KYC renseigné dès l'étape 3
      if (!skipKyc && docNumber.trim() && createdId) {
        try {
          const kycWatchdog = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          await Promise.race([
            supabase.from('verification_records').insert({
              user_id: createdId,
              document_type: docType,
              document_number: docNumber.trim(),
              status: 'pending',
            }),
            kycWatchdog,
          ])
        } catch (kycErr) {
          console.warn('KYC record notice:', kycErr)
        }
      }

      // 3. Mise à jour immédiate du cache local et du state AuthContext
      const completeProfile: Profile = {
        id: createdId,
        clerk_user_id: user.id,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        email: user.email,
        avatar_url: null,
        bio: finalBio || null,
        wallet_provider: walletProvider,
        wallet_number: activeWalletNumber,
        wallet_last_updated_at: new Date().toISOString(),
        verification_status: 'unverified',
        is_admin: profile?.is_admin || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      localStorage.setItem(
        `donkai_profile_${user.id}`,
        JSON.stringify({
          ...completeProfile,
          account_type: accountType,
          whatsapp_number: whatsappNumber.trim(),
          wallets,
        })
      )

      // Injecter directement dans AuthContext pour réactivité instantanée
      setProfileState(completeProfile)

      // Déclencher un rafraîchissement non bloquant en arrière-plan
      refreshProfile().catch(() => {})

      // Navigation directe vers le tableau de bord
      onNavigate('/dashboard')
    } catch (err) {
      console.error('Erreur lors de la configuration du profil :', err)
      setError((err as Error).message || 'Erreur lors de la configuration du profil.')
    } finally {
      setSubmitting(false)
      setSkipping(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 text-left transition-colors">
      <div className="w-full max-w-xl bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-sm p-6 sm:p-9">
        {/* Barre de progression Wizard */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-extrabold uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Étape {step} sur 3
            </span>
            <span className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500">
              {step === 1 && 'Identité & Rôle'}
              {step === 2 && 'Paiement & Contact'}
              {step === 3 && 'Vérification KYC'}
            </span>
          </div>

          <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-orange-500 transition-all duration-300 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ÉTAPE 1 : Rôle & Identifiant */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                Qui êtes-vous ?
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Choisissez le statut correspondant à vos futures collectes sur Donkai.
              </p>
            </div>

            {/* Type de compte */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Type de compte *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ACCOUNT_TYPES.map((type) => {
                  const Icon = type.icon
                  const isSelected = accountType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAccountType(type.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
                          : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 font-bold" />}
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{type.label}</p>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight line-clamp-2">
                        {type.desc}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nom complet */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Nom complet ou Nom de l'organisation *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Awa Diop ou Association Espoir Sahel"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Identifiant unique */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Lien unique de votre page organisateur *
              </label>
              <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                <span className="px-3 py-3 text-xs font-semibold text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 shrink-0">
                  donkai.app/@
                </span>
                <input
                  type="text"
                  required
                  placeholder="nom_ou_asso"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="flex-1 px-3 py-3 text-xs font-bold outline-none text-gray-900 dark:text-white bg-white dark:bg-zinc-800/80"
                />
              </div>

              {checkingUsername && (
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Vérification de la disponibilité...</span>
                </p>
              )}
              {usernameAvailable === true && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Identifiant disponible !</span>
                </p>
              )}
              {usernameAvailable === false && (
                <p className="text-[11px] text-red-500 dark:text-red-400 font-semibold mt-1">
                  Cet identifiant est déjà pris. Veuillez en choisir un autre.
                </p>
              )}
            </div>

            {/* Bio / Présentation */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Bio / Présentation courte (Optionnel)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Fondateur de l'initiative solidaire..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={usernameAvailable === false}
              className="w-full mt-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Continuer vers le paiement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ÉTAPE 2 : Paiement Mobile Money & WhatsApp */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                Coordonnées & Versement
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Configurez le portefeuille qui recevra vos fonds et votre numéro WhatsApp de contact.
              </p>
            </div>

            {/* Numéro WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Numéro WhatsApp officiel
              </label>
              <input
                type="tel"
                placeholder="Ex: +223 70 00 00 00"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                Utilisé pour vous joindre en cas de besoin et recevoir les alertes instantanées.
              </p>
            </div>

            {/* Opérateur de versement avec logos officiels */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Opérateur Mobile Money de réception *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {OPERATORS.map((op) => {
                  const isSelected = walletProvider === op.id
                  const hasNumber = Boolean(wallets[op.id]?.trim())
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setWalletProvider(op.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/30'
                          : `border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 ${op.color}`
                      }`}
                    >
                      <img src={op.logo} alt={op.name} className="h-6 w-auto object-contain max-w-[80px]" />
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white">{op.name}</span>
                      {hasNumber && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md">
                          <Check className="w-2.5 h-2.5" />
                          Renseigné
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Numéro Mobile Money spécifique à l'opérateur sélectionné */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Numéro {OPERATORS.find((o) => o.id === walletProvider)?.name || 'Mobile Money'} du compte de retrait *
              </label>
              <input
                type="tel"
                required
                placeholder={OPERATORS.find((o) => o.id === walletProvider)?.placeholder || 'Ex: +223 70 00 00 00'}
                value={wallets[walletProvider] || ''}
                onChange={(e) => handleWalletNumberChange(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 font-medium mt-1 flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Règle de sécurité : après enregistrement, toute modification de ce numéro est verrouillée pendant 30 jours contre l'usurpation.</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Étape suivante : Vérification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 3 : Vérification KYC (Optionnel au setup, obligatoire avant publication) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                Sécurité & Vérification d'identité
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Garantissez la confiance de vos donateurs grâce à l'identité vérifiée.
              </p>
            </div>

            {/* Note d'information claire sur l'obligation KYC */}
            <div className="p-4 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 rounded-2xl text-xs text-orange-950 dark:text-orange-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-orange-800 dark:text-orange-300">
                <Info className="w-4 h-4 shrink-0" />
                <span>Optionnel maintenant, obligatoire avant publication</span>
              </div>
              <p className="text-gray-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                Vous pouvez finaliser votre compte immédiatement sans déposer de pièce d'identité. La vérification d'identité (KYC) ne sera demandée{' '}
                <strong>qu'au moment où vous effectuerez votre premier retrait de fonds</strong>, pour vous permettre de lancer vos collectes sans aucune friction.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Type de pièce d'identité (Optionnel)
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as 'cni' | 'passport' | 'nina')}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="cni">Carte Nationale d'Identité (CNI)</option>
                  <option value="passport">Passeport biométrique</option>
                  <option value="nina">Fiche Biométrique / Carte NINA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Numéro du document
                </label>
                <input
                  type="text"
                  placeholder="Ex: ML-123456789"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>

              <button
                type="button"
                disabled={submitting || skipping}
                onClick={() => handleFinalSubmit(true)}
                className="flex-1 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center disabled:opacity-50"
              >
                {skipping ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600 dark:text-orange-400" />
                    <span>Finalisation...</span>
                  </span>
                ) : (
                  'Fournir la pièce plus tard'
                )}
              </button>

              <button
                type="button"
                disabled={submitting || skipping || !docNumber.trim()}
                onClick={() => handleFinalSubmit(false)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <span>Vérifier & Finaliser</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
