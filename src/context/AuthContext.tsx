import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Creator } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  creator: Creator | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  creator: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchCreatorProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erreur chargement profil créateur:', error.message)
        setCreator(null)
      } else {
        setCreator(data)
      }
    } catch (err) {
      console.error('Erreur inattendue chargement profil:', err)
      setCreator(null)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchCreatorProfile(user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setCreator(null)
  }

  useEffect(() => {
    // 1. Initialiser la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchCreatorProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // 2. Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await fetchCreatorProfile(newSession.user.id)
      } else {
        setCreator(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        creator,
        loading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
