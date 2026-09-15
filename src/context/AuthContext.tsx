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

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const fetchProfile = async (userId: string, email?: string | null) => {
    try {
      let query = supabase.from('profiles').select('*')
      const filters: string[] = []

      // Seuls les UUIDs valides peuvent interroger la colonne id (de type UUID dans Postgres)
      if (isUUID(userId)) {
        filters.push(`id.eq.${userId}`)
      }
      if (userId) {
        filters.push(`clerk_user_id.eq.${userId}`)
      }
      if (email) {
        filters.push(`email.eq.${email}`)
      }

      if (filters.length === 0) {
        setProfile(null)
        return
      }

      query = query.or(filters.join(','))
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
    let isMounted = true

    // Watchdog : sécurité absolue pour que l'application ne reste JAMAIS bloquée sur un loader
    const watchdogTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false)
      }
    }, 2500)

    // 1. Récupération de la session active (sessionStorage)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return
        clearTimeout(watchdogTimer)

        if (session?.user) {
          const authU = mapSupabaseUser(session.user)
          setUser(authU)
          fetchProfile(session.user.id, session.user.email).finally(() => {
            if (isMounted) setLoading(false)
          })
        } else {
          // Vérifier session dev temporaire liée à l'onglet (sessionStorage)
          const savedDev = sessionStorage.getItem('donkai_dev_user')
          if (savedDev) {
            try {
              const devU = JSON.parse(savedDev) as AuthUser
              setUser(devU)
              fetchProfile(devU.id, devU.email).finally(() => {
                if (isMounted) setLoading(false)
              })
            } catch {
              setUser(null)
              setProfile(null)
              if (isMounted) setLoading(false)
            }
          } else {
            setUser(null)
            setProfile(null)
            if (isMounted) setLoading(false)
          }
        }
      })
      .catch((err) => {
        console.warn('Erreur récupération session initiale :', err)
        if (isMounted) {
          clearTimeout(watchdogTimer)
          setLoading(false)
        }
      })

    // 2. Écoute réactive des changements d'authentification Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session) {
        // Déconnexion ou expiration de session
        const savedDev = sessionStorage.getItem('donkai_dev_user')
        if (!savedDev) {
          startTransition(() => {
            setUser(null)
            setProfile(null)
          })
        }
      } else if (session?.user) {
        const authU = mapSupabaseUser(session.user)
        startTransition(() => {
          setUser(authU)
        })
        await fetchProfile(session.user.id, session.user.email)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(watchdogTimer)
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

  // Déconnexion propre et garantie inconditionnellement
  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.warn('Erreur signOut Supabase (nettoyage local immédiat) :', err)
    } finally {
      try {
        sessionStorage.clear()
        localStorage.removeItem('donkai_dev_user')
        // Nettoyage de tout token persistant obsolète
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key)
          }
        })
      } catch {
        // Ignorer les erreurs d'accès au storage
      }
      startTransition(() => {
        setUser(null)
        setProfile(null)
      })
    }
  }

  // Connexion instantanée de test / dev rapide (strictement liée à l'onglet en cours)
  const devSignIn = async (email: string, username: string) => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    const devU: AuthUser = {
      id: `dev_${cleanUsername}`,
      email: email || `${cleanUsername}@donkai.local`,
      fullName: username,
      imageUrl: null,
    }
    sessionStorage.setItem('donkai_dev_user', JSON.stringify(devU))
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
        id: crypto.randomUUID ? crypto.randomUUID() : 'cea7f212-cc04-4190-b7d4-e15f818e3794',
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
