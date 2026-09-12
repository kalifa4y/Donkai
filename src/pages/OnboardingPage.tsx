import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { WalletProvider } from '../types'
import { Smartphone, Check, Loader2, AlertCircle } from '../components/Icons'

interface OnboardingPageProps {
  onNavigate: (path: string) => void
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { user, creator, refreshProfile } = useAuth()
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
    } else if (creator) {
      onNavigate('/dashboard')
    }
  }, [user, creator, onNavigate])

  // Verification disponibilite du username
  useEffect(() => {
    const cleaned = username.toLowerCase().trim()
    if (cleaned.length < 3) {
      setUsernameAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true)
      const { data } = await supabase
        .from('creators')
        .select('id')
        .eq('username', cleaned)
        .maybeSingle()

      setUsernameAvailable(!data)
      setCheckingUsername(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) return

    const cleanUsername = username.toLowerCase().trim()
    if (cleanUsername.length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caractères.")
      return
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError("Le nom d'utilisateur ne peut contenir que des lettres minuscules, chiffres et tirets bas (_).")
      return
    }

    if (!walletNumber.trim()) {
      setError('Le numéro de téléphone pour les versements est requis.')
      return
    }

    if (!usernameAvailable) {
      setError("Ce nom d'utilisateur n'est pas disponible.")
      return
    }

    setSubmitting(true)

    try {
      const { error: insertError } = await supabase.from('creators').insert({
        id: user.id,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        bio: bio.trim() || null,
        wallet_provider: walletProvider,
        wallet_number: walletNumber.trim(),
      })

      if (insertError) throw insertError

      await refreshProfile()
      onNavigate('/dashboard')
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la création de votre profil.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-orange-100/80 shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-extrabold mx-auto mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
            Configurez votre page créateur
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Définissez votre lien public et le compte Mobile Money qui recevra vos dons.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Identifiant unique (Username) *
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
              <span className="px-3.5 py-3 text-sm font-semibold text-gray-400 bg-gray-50 border-r border-gray-200">
                donkai.app/@
              </span>
              <input
                type="text"
                required
                placeholder="pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="flex-1 px-3 py-3 text-sm font-semibold outline-none text-gray-900"
              />
            </div>
            {checkingUsername && (
              <p className="text-xs text-gray-400 mt-1.5">Vérification de la disponibilité...</p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Identifiant disponible !</span>
              </p>
            )}
            {usernameAvailable === false && (
              <p className="text-xs text-red-500 font-semibold mt-1.5">
                Cet identifiant est déjà réservé.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nom affiché publiquement *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Awa Diop"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Bio / Présentation courte
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Créateur de tutoriels vidéo et podcasts tech à Bamako..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Opérateur Mobile Money de versement *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(['orange', 'wave', 'moov', 'mtn'] as WalletProvider[]).map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setWalletProvider(provider)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    walletProvider === provider
                      ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {provider === 'orange'
                    ? 'Orange'
                    : provider === 'wave'
                    ? 'Wave'
                    : provider === 'moov'
                    ? 'Moov'
                    : 'MTN'}
                </button>
              ))}
            </div>

            <input
              type="tel"
              required
              placeholder="Ex: +223 70 00 00 00"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Numéro sur lequel vous recevrez vos fonds lors de vos demandes de retrait.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || checkingUsername || usernameAvailable === false}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Création de votre page...</span>
              </>
            ) : (
              <span>Lancer ma page créateur</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
