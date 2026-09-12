import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { WalletProvider } from '../types'
import { Smartphone, Check, Loader2, AlertCircle, ArrowRight } from '../components/Icons'

interface OnboardingPageProps {
  onNavigate: (path: string) => void
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [walletProvider, setWalletProvider] = useState<WalletProvider>('orange')
  const [walletNumber, setWalletNumber] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      onNavigate('/login')
    } else if (profile?.username) {
      onNavigate('/dashboard')
    }
  }, [user, profile, onNavigate])

  // Vérification de la disponibilité du nom d'utilisateur
  useEffect(() => {
    const cleaned = username.toLowerCase().trim()
    if (cleaned.length < 3) {
      setUsernameAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true)
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleaned)
        .maybeSingle()

      setUsernameAvailable(!data)
      setCheckingUsername(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) return

    const cleanUsername = username.toLowerCase().trim()
    if (cleanUsername.length < 3) {
      setError("Le nom d'utilisateur doit comporter au moins 3 caractères.")
      return
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError("Le nom d'utilisateur ne peut contenir que des lettres minuscules, chiffres et underscores (_).")
      return
    }

    if (!walletNumber.trim()) {
      setError('Le numéro de versement Mobile Money est requis.')
      return
    }

    setSubmitting(true)

    try {
      const { error: insertError } = await supabase.from('profiles').insert({
        clerk_user_id: user.id,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        email: user.email,
        bio: bio.trim() || null,
        wallet_provider: walletProvider,
        wallet_number: walletNumber.trim(),
        wallet_last_updated_at: new Date().toISOString(),
        verification_status: 'unverified',
      })

      if (insertError) {
        // Enregistrement local en mode secours
        localStorage.setItem(
          `donkai_profile_${user.id}`,
          JSON.stringify({
            clerk_user_id: user.id,
            username: cleanUsername,
            display_name: displayName.trim() || cleanUsername,
            wallet_provider: walletProvider,
            wallet_number: walletNumber.trim(),
          })
        )
      }

      await refreshProfile()
      onNavigate('/dashboard')
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la configuration.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 text-left">
      <div className="w-full max-w-lg bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl font-extrabold mx-auto mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            Finalisez votre profil DONKAI
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Définissez votre lien public et le numéro Mobile Money qui recevra vos fonds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Identifiant unique (Username) *
            </label>
            <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
              <span className="px-3.5 py-3 text-xs font-semibold text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800">
                donkai.app/@
              </span>
              <input
                type="text"
                required
                placeholder="pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="flex-1 px-3 py-3 text-xs font-bold outline-none text-gray-900 dark:text-white bg-white dark:bg-zinc-800/80"
              />
            </div>
            {checkingUsername && (
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">Vérification de la disponibilité...</p>
            )}
            {usernameAvailable === true && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Identifiant disponible !</span>
              </p>
            )}
            {usernameAvailable === false && (
              <p className="text-[11px] text-red-500 dark:text-red-400 font-semibold mt-1">
                Cet identifiant est déjà utilisé.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Nom complet ou d’artiste *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Awa Diop"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Bio / Présentation courte
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Créateur de contenu et documentariste basé à Bamako..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Opérateur Mobile Money de réception *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(['orange', 'wave', 'moov', 'mtn'] as WalletProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setWalletProvider(p)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    walletProvider === p
                      ? 'bg-orange-500 text-white shadow-xs ring-2 ring-orange-500'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <input
              type="tel"
              required
              placeholder="Ex: +223 70 00 00 00"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Ce numéro recevra vos versements lors de vos demandes de retrait.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || checkingUsername || usernameAvailable === false}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Création de votre espace...</span>
              </>
            ) : (
              <>
                <span>Accéder à mon tableau de bord</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
