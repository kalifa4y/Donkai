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
} from '../components/Icons'

interface SettingsPageProps {
  onNavigate: (path: string) => void
}

const OPERATORS: { id: WalletProvider; name: string; logo: string }[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    logo: '/icons/orange-money.svg',
  },
  {
    id: 'wave',
    name: 'Wave',
    logo: '/icons/wave.png',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    logo: '/icons/moov-money.png',
  },
]

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [walletProvider, setWalletProvider] = useState<WalletProvider>('orange')
  const [walletNumber, setWalletNumber] = useState('')

  // KYC
  const [docType, setDocType] = useState('cni')
  const [docNumber, setDocNumber] = useState('')
  const [kycSubmitted, setKycSubmitted] = useState(false)

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/login')
    } else if (profile) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setWalletProvider(profile.wallet_provider || 'orange')
      setWalletNumber(profile.wallet_number || '')

      // Extraction ou récupération du contact WhatsApp
      const savedLocal = localStorage.getItem(`donkai_profile_${user?.id}`)
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal)
          if (parsed.whatsapp_number) setWhatsappNumber(parsed.whatsapp_number)
        } catch {
          // ignore
        }
      }
      if (!whatsappNumber && profile.bio) {
        const match = profile.bio.match(/WhatsApp:\s*([+0-9\s]+)/i)
        if (match) setWhatsappNumber(match[1].trim())
      }
    }
  }, [user, profile, authLoading, onNavigate])

  // Règle des 30 jours pour le numéro de versement
  const walletLock = canUpdateWalletNumber(profile?.wallet_last_updated_at || null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const isChangingWallet =
      profile.wallet_number !== walletNumber.trim() || profile.wallet_provider !== walletProvider

    // Blocage si tentative de modification du numéro avant 30 jours
    if (isChangingWallet && !walletLock.allowed) {
      setError(
        `Par sécurité anti-fraude, votre numéro de réception ne peut pas être modifié avant encore ${walletLock.daysRemaining} jour(s).`
      )
      setSaving(false)
      return
    }

    try {
      let finalBio = bio.trim()
      if (whatsappNumber.trim() && !finalBio.includes(whatsappNumber.trim())) {
        const contactTag = `[Contact WhatsApp: ${whatsappNumber.trim()}]`
        finalBio = finalBio ? `${contactTag}\n${finalBio}` : contactTag
      }

      const updates: Record<string, unknown> = {
        display_name: displayName.trim() || profile.username,
        bio: finalBio || null,
        updated_at: new Date().toISOString(),
      }

      if (isChangingWallet) {
        updates.wallet_provider = walletProvider
        updates.wallet_number = walletNumber.trim()
        updates.wallet_last_updated_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Mettre à jour les données locales
      if (user?.id) {
        const existingLocal = localStorage.getItem(`donkai_profile_${user.id}`)
        const currentData = existingLocal ? JSON.parse(existingLocal) : {}
        localStorage.setItem(
          `donkai_profile_${user.id}`,
          JSON.stringify({
            ...currentData,
            display_name: displayName.trim() || profile.username,
            whatsapp_number: whatsappNumber.trim(),
            wallet_provider: walletProvider,
            wallet_number: walletNumber.trim(),
          })
        )
      }

      await refreshProfile()
      setSuccess(
        isChangingWallet
          ? 'Profil mis à jour avec succès. Le numéro de réception est désormais verrouillé pour 30 jours.'
          : 'Vos modifications ont été enregistrées avec succès.'
      )
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docNumber.trim() || !profile) return

    setSaving(true)
    setError(null)
    try {
      await supabase.from('verification_records').insert({
        user_id: profile.id,
        document_type: docType,
        document_number: docNumber.trim(),
        status: 'pending',
      })
      setKycSubmitted(true)
    } catch (err) {
      console.warn('KYC submit error:', err)
      setKycSubmitted(true)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
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
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-3 px-5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <span>Finaliser mon profil</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 text-left transition-colors">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
          Paramètres & Sécurité
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Gérez votre profil public, votre numéro de versement Mobile Money et votre vérification d'identité.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 rounded-2xl text-xs font-medium flex items-center gap-2">
          <CircleCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Profil public & Coordonnées */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs p-6 sm:p-7 space-y-4">
          <h2 className="text-base font-extrabold text-gray-950 dark:text-white pb-2 border-b border-gray-100 dark:border-zinc-800">
            Profil public & Contact
          </h2>

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
              L'identifiant unique garantit la pérennité de vos liens publics (donkai.app/@{profile.username}).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Nom complet ou Nom d'organisation *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Numéro WhatsApp de contact
            </label>
            <input
              type="tel"
              placeholder="+223 70 00 00 00"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Bio / Présentation
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* 2. Coordonnées de versement & Règle des 30 jours */}
        <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-base font-extrabold text-gray-950 dark:text-white">
              Coordonnées de versement Mobile Money
            </h2>
            {!walletLock.allowed && (
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Verrouillé ({walletLock.daysRemaining}j restants)</span>
              </span>
            )}
          </div>

          {!walletLock.allowed ? (
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Protection anti-fraude active (Verrou 30 jours)</span>
              </p>
              <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed text-[11px]">
                Pour protéger vos collectes contre tout détournement de fonds en cas de compromission de compte, aucune modification du numéro de retrait n'est autorisée avant <strong>{walletLock.daysRemaining} jour(s)</strong>.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Après toute modification de votre numéro de réception, celui-ci sera automatiquement <strong>verrouillé pendant 30 jours</strong>.
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Opérateur Mobile Money
            </label>
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {OPERATORS.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  disabled={!walletLock.allowed}
                  onClick={() => setWalletProvider(op.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                    walletProvider === op.id
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/30'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 disabled:opacity-50'
                  }`}
                >
                  <img src={op.logo} alt={op.name} className="h-6 w-auto object-contain max-w-[80px]" />
                  <span className="text-[11px] font-bold text-gray-900 dark:text-white">{op.name}</span>
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Numéro de téléphone du portefeuille *
            </label>
            <input
              type="tel"
              required
              disabled={!walletLock.allowed}
              placeholder="+223 70 00 00 00"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:text-gray-500 dark:disabled:text-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-xs transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enregistrer les coordonnées</span>}
          </button>
        </div>
      </form>

      {/* 3. Vérification d'identité & KYC */}
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-extrabold text-gray-950 dark:text-white">
              Vérification d'identité (KYC)
            </h2>
          </div>
          {profile.verification_status === 'verified' ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Profil vérifié</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">Non vérifié</span>
          )}
        </div>

        {profile.verification_status === 'verified' ? (
          <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
            Votre identité a été validée par nos équipes. Vos collectes bénéficient du badge officiel de confiance "Identité vérifiée" et sont exemptes de plafonds de retrait.
          </p>
        ) : kycSubmitted ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dossier de vérification en cours d'examen</span>
            </p>
            <p className="text-emerald-800 dark:text-emerald-300/90 text-[11px]">
              Nos équipes examinent vos pièces justificatives sous 24h. Vous recevrez une notification par email dès que le dossier aura été traité.
            </p>
          </div>
        ) : (
          <form onSubmit={handleKycSubmit} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              La vérification est exigée pour publier vos collectes en ligne et autoriser les versements volumineux supérieurs à <strong>500 000 FCFA</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Type de pièce
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="cni">Carte Nationale d’Identité (CNI)</option>
                  <option value="passport">Passeport biométrique</option>
                  <option value="nina">Fiche Biométrique / Carte NINA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Numéro du document
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ML-123456789"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-gray-950 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-gray-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Soumettre pour validation KYC</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
