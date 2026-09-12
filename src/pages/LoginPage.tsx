import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Loader2, AlertCircle, Sparkles, CircleCheck } from '../components/Icons'

interface LoginPageProps {
  onNavigate: (path: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { user, creator } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Rediriger si deja connecte
  if (user) {
    if (creator) {
      onNavigate('/dashboard')
    } else {
      onNavigate('/onboarding')
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (useMagicLink) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })
        if (otpError) throw otpError
        setMagicLinkSent(true)
      } else if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (signUpError) throw signUpError

        if (data.session) {
          onNavigate('/onboarding')
        } else {
          setMagicLinkSent(true)
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
        onNavigate('/dashboard')
      }
    } catch (err) {
      setError((err as Error).message || "Une erreur est survenue lors de l'authentification.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-orange-100/80 shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center text-xl font-extrabold mx-auto mb-4 shadow-sm shadow-orange-500/20">
            D
          </div>
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
            {isSignUp ? 'Créer votre compte' : 'Accéder à votre espace'}
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {isSignUp
              ? 'Rejoignez la plateforme de monétisation pour créateurs'
              : 'Gérez vos dons et vos versements Mobile Money'}
          </p>
        </div>

        {magicLinkSent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CircleCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Vérifiez votre boîte e-mail</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Un lien de connexion sécurisé a été envoyé à <strong>{email}</strong>. Cliquez dessus pour accéder directement à votre compte.
            </p>
            <button
              type="button"
              onClick={() => {
                setMagicLinkSent(false)
                setUseMagicLink(false)
              }}
              className="text-xs text-orange-600 font-bold hover:underline mt-4"
            >
              Retour à la connexion standard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {!useMagicLink && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : useMagicLink ? (
                <span>Envoyer le lien magique</span>
              ) : isSignUp ? (
                <span>Créer mon compte</span>
              ) : (
                <span>Se connecter</span>
              )}
            </button>

            <div className="pt-2 flex flex-col items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setUseMagicLink(!useMagicLink)}
                className="text-gray-500 hover:text-orange-600 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {useMagicLink ? 'Utiliser un mot de passe' : 'Connexion sans mot de passe (Magic Link)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                }}
                className="text-gray-700 font-bold hover:underline"
              >
                {isSignUp
                  ? 'Déjà un compte ? Connectez-vous'
                  : "Vous n'avez pas de compte ? Inscrivez-vous"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
