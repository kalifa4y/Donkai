import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string | null
  fullName: string | null
  imageUrl: string | null
}

export interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  isClerkConfigured: boolean
  refreshProfile: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string, username?: string, fullName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  devSignIn: (email: string, username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isClerkConfigured: false,
  refreshProfile: async () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signOut: async () => {},
  devSignIn: async () => {},
})

function mapSupabaseUser(su: SupabaseUser): AuthUser {
  return {
    id: su.id,
    email: su.email || null,
    fullName: (su.user_metadata?.full_name as string) || (su.user_metadata?.name as string) || null,
    imageUrl: (su.user_metadata?.avatar_url as string) || (su.user_metadata?.picture as string) || null,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const fetchProfile = async (userId: string, email?: string | null) => {
    try {
      // Recherche par id ou clerk_user_id ou email
      let query = supabase.from('profiles').select('*')
      if (email) {
        query = query.or(`id.eq.${userId},clerk_user_id.eq.${userId},email.eq.${email}`)
      } else {
        query = query.or(`id.eq.${userId},clerk_user_id.eq.${userId}`)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        console.warn('Profil non trouvé ou erreur :', error.message)
        setProfile(null)
      } else if (data) {
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Erreur fetchProfile :', err)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email)
    }
  }

  useEffect(() => {
    // 1. Récupération de la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authU = mapSupabaseUser(session.user)
        setUser(authU)
        fetchProfile(session.user.id, session.user.email).finally(() => {
          setLoading(false)
        })
      } else {
        // Vérifier si un utilisateur dev local existe
        const savedDev = localStorage.getItem('donkai_dev_user')
        if (savedDev) {
          try {
            const devU = JSON.parse(savedDev) as AuthUser
            setUser(devU)
            fetchProfile(devU.id, devU.email).finally(() => {
              setLoading(false)
            })
          } catch {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    })

    // 2. Écoute réactive des changements d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const authU = mapSupabaseUser(session.user)
          startTransition(() => {
            setUser(authU)
          })
          await fetchProfile(session.user.id, session.user.email)
        } else {
          const savedDev = localStorage.getItem('donkai_dev_user')
          if (!savedDev) {
            startTransition(() => {
              setUser(null)
              setProfile(null)
            })
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Connexion Google OAuth 1-clic
  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/dashboard`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })
    if (error) {
      console.error('Erreur Google OAuth :', error.message)
      throw error
    }
  }

  // Connexion Email & Mot de passe
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error ? new Error(error.message) : null }
  }

  // Inscription Email & Mot de passe
  const signUpWithEmail = async (
    email: string,
    password: string,
    username?: string,
    fullName?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || '',
          full_name: fullName || '',
        },
      },
    })

    if (!error && data.user && username) {
      // Pré-création du profil dans la table profiles si possible
      await supabase.from('profiles').insert({
        id: data.user.id,
        clerk_user_id: data.user.id,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        display_name: fullName || username,
        email: email,
        verification_status: 'unverified',
      }).select().maybeSingle()
    }

    return { error: error ? new Error(error.message) : null }
  }

  // Déconnexion
  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('donkai_dev_user')
    setUser(null)
    setProfile(null)
  }

  // Connexion instantanée de test / dev rapide
  const devSignIn = async (email: string, username: string) => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    const devU: AuthUser = {
      id: `dev_${cleanUsername}`,
      email: email || `${cleanUsername}@donkai.local`,
      fullName: username,
      imageUrl: null,
    }
    localStorage.setItem('donkai_dev_user', JSON.stringify(devU))
    setUser(devU)

    // Vérifier ou créer profil
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (existing) {
      setProfile(existing)
    } else {
      const newProf: Profile = {
        id: devU.id,
        clerk_user_id: devU.id,
        username: cleanUsername,
        display_name: username,
        email: devU.email,
        bio: 'Créateur Donkai',
        avatar_url: null,
        verification_status: 'verified',
        wallet_provider: 'orange',
        wallet_number: '+223 70 00 00 00',
        wallet_last_updated_at: null,
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await supabase.from('profiles').upsert(newProf)
      setProfile(newProf)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isClerkConfigured: false,
        refreshProfile,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        devSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
