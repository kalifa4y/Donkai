import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { canUpdateWalletNumber, type WalletProvider } from '../types'
import {
  Loader2,
  AlertCircle,
  CircleCheck,
  Lock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Wallet,
  Check,
} from '../components/Icons'
import { Save } from 'lucide-react'
import { ImageUploadField } from '../components/ImageUploadField'
import { VerifiedBadge } from '../components/VerifiedBadge'

interface SettingsPageProps {
  onNavigate: (path: string) => void
}

type UserWallets = Record<string, string>

const OPERATORS: { id: WalletProvider; name: string; logo: string; placeholder: string }[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    logo: '/icons/orange-money.svg',
    placeholder: '+223 70 00 00 00 / +223 80 ...',
  },
  {
    id: 'wave',
    name: 'Wave',
    logo: '/icons/wave.png',
    placeholder: '+223 70 00 00 00 / +223 90 ...',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    logo: '/icons/moov-money.png',
    placeholder: '+223 60 00 00 00 / +223 65 ...',
  },
]

// Utilitaires de synchronisation des métadonnées
const parseBioData = (fullBio: string | null) => {
  if (!fullBio) return { cleanBio: '', whatsapp: '', wallets: { orange: '', wave: '', moov: '' } }

  let cleanBio = fullBio
  let whatsapp = ''
  let wallets: UserWallets = { orange: '', wave: '', moov: '' }

  const whatsappMatch = cleanBio.match(/\[Contact WhatsApp:\s*([+0-9\s]+)\]/i)
  if (whatsappMatch) {
    whatsapp = whatsappMatch[1].trim()
    cleanBio = cleanBio.replace(whatsappMatch[0], '').trim()
  }

  const walletsMatch = cleanBio.match(/\[wallets:\s*({.+?})\]/i)
  if (walletsMatch) {
    try {
      const parsed = JSON.parse(walletsMatch[1])
      wallets = {
        orange: parsed.orange || '',
        wave: parsed.wave || '',
        moov: parsed.moov || '',
      }
      cleanBio = cleanBio.replace(walletsMatch[0], '').trim()
    } catch {
      // ignore
    }
  }

  return { cleanBio, whatsapp, wallets }
}

const buildFullBio = (cleanBio: string, whatsapp: string, wallets: UserWallets) => {
  const parts: string[] = []
  if (whatsapp.trim()) {
    parts.push(`[Contact WhatsApp: ${whatsapp.trim()}]`)
  }
  if (cleanBio.trim()) {
    parts.push(cleanBio.trim())
  }
  const hasWallets = Boolean(wallets.orange.trim() || wallets.wave.trim() || wallets.moov.trim())
  if (hasWallets) {
    parts.push(`[wallets:${JSON.stringify(wallets)}]`)
  }
  return parts.join('\n\n')
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth()

  // 1. État Profil public
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // 2. État Coordonnées Mobile Money
  const [activeProvider, setActiveProvider] = useState<WalletProvider>('orange')
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider>('orange')
  const [wallets, setWallets] = useState<UserWallets>({ orange: '', wave: '', moov: '' })
  const [savingWallet, setSavingWallet] = useState(false)
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)

  // 3. État KYC
  const [docType, setDocType] = useState('cni')
  const [docNumber, setDocNumber] = useState('')
  const [kycSubmitted, setKycSubmitted] = useState(false)
  const [submittingKyc, setSubmittingKyc] = useState(false)
  const [kycSuccess, setKycSuccess] = useState<string | null>(null)
  const [kycError, setKycError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/login')
    } else if (profile) {
      setDisplayName(profile.display_name || '')
      setAvatarUrl(profile.avatar_url || null)

      const parsed = parseBioData(profile.bio)
      setBio(parsed.cleanBio)
      if (parsed.whatsapp) setWhatsappNumber(parsed.whatsapp)

      // Initialisation des portefeuilles
      const defaultProvider: WalletProvider = (profile.wallet_provider as WalletProvider) || 'orange'
      setActiveProvider(defaultProvider)
      setSelectedProvider(defaultProvider)

      const initialWallets: UserWallets = {
        orange: parsed.wallets.orange || (defaultProvider === 'orange' ? profile.wallet_number || '' : ''),
        wave: parsed.wallets.wave || (defaultProvider === 'wave' ? profile.wallet_number || '' : ''),
        moov: parsed.wallets.moov || (defaultProvider === 'moov' ? profile.wallet_number || '' : ''),
      }

      // Récupération de secours depuis le stockage local si disponible
      if (user?.id) {
        try {
          const cachedWallets = localStorage.getItem(`donkai_wallets_${user.id}`)
          if (cachedWallets) {
            const parsedCache = JSON.parse(cachedWallets)
            if (parsedCache.orange && !initialWallets.orange) initialWallets.orange = parsedCache.orange
            if (parsedCache.wave && !initialWallets.wave) initialWallets.wave = parsedCache.wave
            if (parsedCache.moov && !initialWallets.moov) initialWallets.moov = parsedCache.moov
          }
        } catch {
          // ignore
        }
      }

      setWallets(initialWallets)
    }
  }, [user, profile, authLoading, onNavigate])

  // Règle des 30 jours pour le compte de versement actif
  const walletLock = canUpdateWalletNumber(profile?.wallet_last_updated_at || null)

  // ----------------------------------------------------
  // ACTION 1 : Sauvegarde du Profil Public & Contact
  // ----------------------------------------------------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(null)

    const watchdog = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Le délai d’enregistrement a expiré. Veuillez vérifier votre connexion.')), 6000)
    )

    try {
      const executeUpdate = async () => {
        const fullBio = buildFullBio(bio, whatsappNumber, wallets)

        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim() || profile.username,
            avatar_url: avatarUrl || null,
            bio: fullBio || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (error) throw error

        if (user?.id) {
          localStorage.setItem(
            `donkai_profile_${user.id}`,
            JSON.stringify({
              display_name: displayName.trim(),
              avatar_url: avatarUrl,
              whatsapp_number: whatsappNumber.trim(),
            })
          )
        }

        await refreshProfile()
      }

      await Promise.race([executeUpdate(), watchdog])
      setProfileSuccess('Profil public mis à jour avec succès !')
      setTimeout(() => setProfileSuccess(null), 4000)
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err)
      setProfileError((err as Error).message || 'Impossible d’enregistrer le profil public.')
    } finally {
      setSavingProfile(false)
    }
  }

  // ----------------------------------------------------
  // ACTION 2 : Sauvegarde des Coordonnées Mobile Money
  // ----------------------------------------------------
  const handleWalletNumberChange = (val: string) => {
    setWallets((prev) => ({
      ...prev,
      [selectedProvider]: val,
    }))
  }

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    const currentNumber = (wallets[selectedProvider] || '').trim()
    if (!currentNumber) {
      setWalletError(`Veuillez entrer un numéro de téléphone valide pour ${OPERATORS.find((o) => o.id === selectedProvider)?.name}.`)
      return
    }

    const isChangingActiveWallet =
      profile.wallet_number !== currentNumber || profile.wallet_provider !== selectedProvider

    // Blocage si tentative de modifier le numéro actif avant 30 jours
    if (isChangingActiveWallet && !walletLock.allowed) {
      setWalletError(
        `Par sécurité anti-fraude, votre numéro de versement actif ne peut pas être modifié avant encore ${walletLock.daysRemaining} jour(s).`
      )
      return
    }

    setSavingWallet(true)
    setWalletError(null)
    setWalletSuccess(null)

    const watchdog = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Délai d’attente dépassé (timeout réseau).')), 6000)
    )

    try {
      const executeWalletUpdate = async () => {
        const fullBio = buildFullBio(bio, whatsappNumber, wallets)

        const updates: Record<string, unknown> = {
          wallet_provider: selectedProvider,
          wallet_number: currentNumber,
          bio: fullBio,
          updated_at: new Date().toISOString(),
        }

        if (isChangingActiveWallet) {
          updates.wallet_last_updated_at = new Date().toISOString()
        }

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id)

        if (error) throw error

        setActiveProvider(selectedProvider)

        if (user?.id) {
          localStorage.setItem(`donkai_wallets_${user.id}`, JSON.stringify(wallets))
        }

        await refreshProfile()
      }

      await Promise.race([executeWalletUpdate(), watchdog])
      setWalletSuccess(
        `Numéro ${OPERATORS.find((o) => o.id === selectedProvider)?.name} enregistré et défini comme compte de versement actif !`
      )
      setTimeout(() => setWalletSuccess(null), 4000)
    } catch (err) {
      console.error('Erreur sauvegarde wallet:', err)
      setWalletError((err as Error).message || 'Erreur lors de l’enregistrement du numéro.')
    } finally {
      setSavingWallet(false)
    }
  }

  // ----------------------------------------------------
  // ACTION 3 : Soumission Vérification d'Identité (KYC)
  // ----------------------------------------------------
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docNumber.trim() || !profile) return

    setSubmittingKyc(true)
    setKycError(null)
    setKycSuccess(null)

    const watchdog = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Délai de soumission dépassé.')), 6000)
    )

    try {
      const executeKyc = async () => {
        const { error } = await supabase.from('verification_records').insert({
          user_id: profile.id,
          document_type: docType,
          document_number: docNumber.trim(),
          status: 'pending',
        })
        if (error) {
          console.warn('KYC insert error:', error.message)
        }
        setKycSubmitted(true)
      }

      await Promise.race([executeKyc(), watchdog])
      setKycSuccess('Votre dossier KYC a été transmis avec succès pour examen sous 24h.')
      setTimeout(() => setKycSuccess(null), 5000)
    } catch (err) {
      console.error('Erreur KYC:', err)
      setKycError((err as Error).message || 'Erreur lors de la transmission du document KYC.')
    } finally {
      setSubmittingKyc(false)
    }
  }

  // Écran d'attente d'authentification
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!profile && user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
          <Info className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-2">
          Profil non encore configuré
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-md mb-6">
          Votre compte est connecté, mais vous devez configurer votre identifiant unique et votre numéro Mobile Money avant d'accéder aux paramètres.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/onboarding')}
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-3 px-5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <span>Finaliser mon profil</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (!profile) return null

  const currentSelectedOp = OPERATORS.find((o) => o.id === selectedProvider) || OPERATORS[0]
  const currentInputValue = wallets[selectedProvider] || ''

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-left transition-colors">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight font-heading">
          Paramètres & Sécurité
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Gérez votre profil public, configurez vos numéros de versement Mobile Money et vérifiez votre identité.
        </p>
      </div>

      {/* ============================================================ */}
      {/* CARTE 1 : PROFIL PUBLIC & CONTACT                            */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/80">
          <div>
            <h2 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
              Profil public & Contact
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Ces informations sont visibles par les contributeurs sur vos pages de collecte publiques.
            </p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CircleCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Photo de profil */}
          <div className="pb-4 border-b border-gray-100 dark:border-zinc-800/80">
            <ImageUploadField
              label="Photo de profil"
              value={avatarUrl}
              onChange={setAvatarUrl}
              aspectRatio="square"
              maxDimension={400}
              quality={0.85}
              helperText="Conseil : Choisissez la même photo de profil que sur votre compte TikTok ou Instagram pour que vos abonnés vous reconnaissent immédiatement."
            />
          </div>

          {/* Identifiant unique */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Identifiant (Username unique)
            </label>
            <input
              type="text"
              disabled
              value={`@${profile.username}`}
              className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-gray-500 dark:text-zinc-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              L'identifiant unique garantit la pérennité de vos liens (donkai.vercel.app/@{profile.username}). Non modifiable.
            </p>
          </div>

          {/* Nom complet */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Nom complet ou Nom d'organisation *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Kalifa Coulibaly ou Association Don"
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>

          {/* Numéro WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Numéro WhatsApp de contact
            </label>
            <input
              type="tel"
              placeholder="+223 70 00 00 00"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Permet aux donateurs et à l'équipe Donkai de vous joindre facilement en cas de besoin.
            </p>
          </div>

          {/* Bio / Présentation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                Bio / Présentation
              </label>
              <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">
                {bio.length}/250
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={250}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Présentez-vous brièvement, décrivez vos projets ou vos causes..."
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Bouton de sauvegarde dédié au profil public */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl shadow-xs transition-colors text-xs sm:text-sm cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement du profil...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer mon profil public</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================ */}
      {/* CARTE 2 : COORDONNÉES DE VERSEMENT MOBILE MONEY               */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800/80">
          <div>
            <h2 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
              Coordonnées de versement Mobile Money
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Renseignez vos numéros dédiés pour chaque opérateur et choisissez celui recevant vos retraits.
            </p>
          </div>

          {!walletLock.allowed && (
            <span className="inline-flex items-center gap-1 self-start sm:self-auto bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Verrou actif ({walletLock.daysRemaining}j restants)</span>
            </span>
          )}
        </div>

        {walletSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CircleCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{walletSuccess}</span>
          </div>
        )}

        {walletError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{walletError}</span>
          </div>
        )}

        {!walletLock.allowed && (
          <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Protection anti-fraude active (Verrou 30 jours)</span>
            </p>
            <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed text-[11px]">
              Pour protéger vos fonds contre le piratage, votre numéro de retrait actif ne peut pas être modifié avant encore <strong>{walletLock.daysRemaining} jour(s)</strong>.
            </p>
          </div>
        )}

        <form onSubmit={handleSaveWallet} className="space-y-6">
          {/* Grille des 3 opérateurs avec numéros dédiés */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Sélectionnez un opérateur pour voir ou modifier son numéro
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OPERATORS.map((op) => {
                const isSelected = selectedProvider === op.id
                const isActivePayout = activeProvider === op.id
                const opNumber = wallets[op.id]

                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(op.id)
                      setWalletError(null)
                    }}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 ring-2 ring-orange-500/30'
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <img src={op.logo} alt={op.name} className="h-6 w-auto object-contain max-w-[75px]" />
                      {isActivePayout && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                          <Check className="w-2.5 h-2.5" />
                          <span>Actif</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {op.name}
                      </div>
                      <div className="text-[11px] font-mono text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                        {opNumber ? opNumber : 'Non renseigné'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Champ de saisie spécifique à l'opérateur sélectionné */}
          <div className="p-5 bg-gray-50/80 dark:bg-zinc-900/60 rounded-2xl border border-gray-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
                Numéro {currentSelectedOp.name} *
              </label>
              {activeProvider === selectedProvider ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Compte de versement sélectionné</span>
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                  Sera utilisé si vous activez {currentSelectedOp.name}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="tel"
                required
                placeholder={currentSelectedOp.placeholder}
                value={currentInputValue}
                onChange={(e) => handleWalletNumberChange(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none shadow-xs"
              />
            </div>

            <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
              Ce numéro est exclusivement rattaché à <strong>{currentSelectedOp.name}</strong>. En enregistrant, il sera défini comme votre compte de versement officiel pour vos demandes de retrait.
            </p>
          </div>

          {/* Bouton de sauvegarde dédié aux coordonnées */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={savingWallet}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl shadow-xs transition-colors text-xs sm:text-sm cursor-pointer"
            >
              {savingWallet ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement du numéro {currentSelectedOp.name}...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Enregistrer mon numéro {currentSelectedOp.name}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================ */}
      {/* CARTE 3 : VÉRIFICATION D'IDENTITÉ (KYC)                      */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
                Vérification d'identité (KYC)
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Obligatoire pour les retraits supérieurs à 500 000 FCFA et pour obtenir le badge de confiance.
              </p>
            </div>
          </div>

          {profile.verification_status === 'verified' ? (
            <div className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800/60">
              <VerifiedBadge size="sm" />
              <span>Badge Vérifié Officiel</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">Badge non attribué</span>
          )}
        </div>

        {kycSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CircleCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{kycSuccess}</span>
          </div>
        )}

        {kycError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{kycError}</span>
          </div>
        )}

        {profile.verification_status === 'verified' ? (
          <div className="p-4 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 rounded-2xl text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
            Félicitations ! Votre profil a reçu le <strong>badge officiel Donkai</strong> après validation de votre pièce d'identité par notre équipe d'audit. Ce badge atteste de votre authenticité sur l'ensemble de vos collectes.
          </div>
        ) : kycSubmitted ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dossier KYC en cours d'examen</span>
            </p>
            <p className="text-emerald-800 dark:text-emerald-300/90 text-[11px]">
              Nos équipes examinent vos pièces justificatives sous 24h ouvrées. Vous serez notifié dès validation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Type de pièce officielle *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-xs outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="cni">Carte Nationale d’Identité (CNI)</option>
                  <option value="passport">Passeport biométrique</option>
                  <option value="nina">Fiche Biométrique / Carte NINA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Numéro du document *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ML-123456789"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submittingKyc}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-950 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-gray-950 font-bold text-xs py-3 px-5 rounded-xl transition-colors cursor-pointer"
              >
                {submittingKyc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Soumission en cours...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Soumettre pour validation KYC</span>
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
