import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from '../components/Icons'

interface LoginPageProps {
  onNavigate: (path: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const {
    user,
    profile,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    devSignIn,
  } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Si déjà authentifié, redirection
  if (user) {
    if (profile?.username) {
      onNavigate('/dashboard')
    } else {
      onNavigate('/onboarding')
    }
    return null
  }

  // Connexion Google
  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur Google'
      if (msg.includes('provider is not enabled') || msg.includes('Unsupported provider')) {
        setError(
          "L'authentification Google n'est pas encore activée dans votre tableau de bord Supabase (Authentication > Providers > Google). Vous pouvez vous connecter immédiatement avec votre email et mot de passe ci-dessous !"
        )
      } else {
        setError(`Impossible de se connecter avec Google : ${msg}`)
      }
      setLoading(false)
    }
  }

  // Connexion / Inscription Email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir votre email et mot de passe.')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Veuillez choisir un nom d’utilisateur (pseudo).')
          setLoading(false)
          return
        }

        const { error: signUpError } = await signUpWithEmail(
          email.trim(),
          password,
          username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
          fullName.trim() || username.trim()
        )

        if (signUpError) {
          setError(signUpError.message)
        } else {
          setMessage(
            'Compte créé avec succès ! Si un email de confirmation vous est envoyé, veuillez cliquer sur le lien.'
          )
          onNavigate('/onboarding')
        }
      } else {
        const { error: signInError } = await signInWithEmail(email.trim(), password)
        if (signInError) {
          setError(signInError.message || 'Identifiants invalides.')
        } else {
          onNavigate('/dashboard')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Accès de test rapide
  const handleQuickDev = async () => {
    setLoading(true)
    try {
      await devSignIn('admin@donkai.ml', 'kalifa')
      onNavigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#12141f] rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-xl font-heading font-extrabold mx-auto mb-3 shadow-md shadow-orange-600/20">
          D
        </div>

        <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight text-center font-heading">
          {isSignUp ? 'Créer votre compte' : 'Accéder à votre espace'}
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6 text-center">
          Plateforme de collecte de dons par Mobile Money en Afrique de l'Ouest
        </p>

        {/* Messages Toast d'état */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300">
            {message}
          </div>
        )}

        {/* 1-CLIC GOOGLE SIGN-IN */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#181b29] border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-800 dark:text-zinc-200 font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuer avec Google</span>
        </button>

        {/* Séparateur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white dark:bg-[#12141f] px-3 text-gray-400 dark:text-zinc-500">
              Ou avec votre adresse email
            </span>
          </div>
        </div>

        {/* Formulaire Email & Mot de passe */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Nom d'utilisateur (Pseudo) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ex: kalifa"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Nom complet affiché
                </label>
                <input
                  type="text"
                  placeholder="ex: Kalifa Traoré"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Adresse Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="votre-email@domaine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-2xl text-xs transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Créer mon compte' : 'Se connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Bascule Inscription / Connexion */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-zinc-400">
          {isSignUp ? (
            <p>
              Vous avez déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Se connecter
              </button>
            </p>
          ) : (
            <p>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Créer un compte
              </button>
            </p>
          )}
        </div>

        {/* Accès Rapide Dev */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={handleQuickDev}
            className="text-[11px] font-bold text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Connexion démo rapide (Mode créateur)
          </button>
        </div>
      </div>
    </div>
  )
}
