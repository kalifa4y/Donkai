import React, { useState } from 'react'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { useAuth } from '../context/AuthContext'
import { Mail, User, ArrowRight, AlertCircle, Loader2 } from '../components/Icons'

interface LoginPageProps {
  onNavigate: (path: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { user, profile, isClerkConfigured, devSignIn } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [devEmail, setDevEmail] = useState('')
  const [devUsername, setDevUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si déjà authentifié, redirection vers dashboard
  if (user) {
    if (profile?.username) {
      onNavigate('/dashboard')
    } else {
      onNavigate('/onboarding')
    }
    return null
  }

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!devUsername.trim()) {
      setError('Veuillez renseigner un pseudo.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await devSignIn(devEmail.trim(), devUsername.trim())
      onNavigate('/dashboard')
    } catch (err) {
      setError((err as Error).message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#12141f] rounded-3xl border border-orange-100/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8 text-center">
        {/* Logo de marque */}
        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-xl font-heading font-bold mx-auto mb-4 shadow-sm shadow-orange-500/20">
          D
        </div>

        <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight mb-1.5">
          {isSignUp ? 'Créer votre compte' : 'Accéder à votre espace'}
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
          Plateforme de collecte communautaire par Mobile Money
        </p>

        {isClerkConfigured ? (
          // Interface Clerk officielle si la clé est fournie
          <div className="flex justify-center">
            {isSignUp ? (
              <SignUp
                routing="virtual"
                afterSignUpUrl="/onboarding"
                signInUrl="/login"
              />
            ) : (
              <SignIn
                routing="virtual"
                afterSignInUrl="/dashboard"
                signUpUrl="/login"
              />
            )}
          </div>
        ) : (
          // Formulaire d'authentification pour développement local
          <form onSubmit={handleDevSubmit} className="space-y-4 text-left">
            <div className="p-3.5 bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/50 rounded-2xl text-[11px] text-orange-900 dark:text-orange-300 leading-relaxed">
              <span className="font-bold">Mode développement actif :</span> Entrez votre pseudo pour accéder directement au tableau de bord Donkai. En production, Clerk gère l'authentification sécurisée.
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Nom d'utilisateur (Username) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: kalifa"
                  value={devUsername}
                  onChange={(e) =>
                    setDevUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <User className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Adresse email (optionnelle)
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="nom@exemple.com"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <Mail className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Entrer dans l'espace créateur</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 font-bold underline cursor-pointer"
          >
            {isSignUp
              ? 'Déjà un compte ? Connectez-vous'
              : 'Nouveau sur Donkai ? Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  )
}
