import React, { createContext, useContext, useEffect, useState } from 'react'
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthUser {
  id: string
  email: string | null
  fullName: string | null
  imageUrl: string | null
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  isClerkConfigured: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  // Méthode de secours pour tester sans clé Clerk en développement local
  devSignIn: (email: string, username: string) => Promise<void>
}

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
// Vérification si une clé Clerk valide est fournie (commence par pk_test_ ou pk_live_)
const HAS_VALID_CLERK_KEY = Boolean(
  CLERK_PUBLISHABLE_KEY &&
  (CLERK_PUBLISHABLE_KEY.startsWith('pk_test_') || CLERK_PUBLISHABLE_KEY.startsWith('pk_live_'))
)

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isClerkConfigured: HAS_VALID_CLERK_KEY,
  refreshProfile: async () => {},
  signOut: async () => {},
  devSignIn: async () => {},
})

/**
 * Composant interne connecté au SDK Clerk officiel
 */
const ClerkAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchProfile = async (clerkId: string) => {
    try {
      setProfileLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', clerkId)
        .maybeSingle()

      if (error) {
        console.error('Erreur chargement profil Donkai:', error.message)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (clerkUser?.id) {
      await fetchProfile(clerkUser.id)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      if (clerkUser?.id) {
        fetchProfile(clerkUser.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
    }
  }, [isLoaded, clerkUser?.id])

  const user: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        fullName: clerkUser.fullName || clerkUser.username || null,
        imageUrl: clerkUser.imageUrl || null,
      }
    : null

  const signOut = async () => {
    await clerkSignOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading: !isLoaded || profileLoading,
        isClerkConfigured: true,
        refreshProfile,
        signOut,
        devSignIn: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Gestionnaire d'authentification fallback si aucune clé Clerk n'est configurée dans le fichier .env
 * [NOTE CRITIQUE] : Il s'agit d'un fallback pour développement local sans bloquer l'équipe avant l'ajout de la clé Clerk.
 */
const LocalDevAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devUser, setDevUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('donkai_dev_user')
    return saved ? JSON.parse(saved) : null
  })
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (clerkUserId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

      if (error) {
        // Si la table profiles n'est pas encore créée en local, fallback sur creators ou objet mock
        const { data: creatorData } = await supabase
          .from('creators')
          .select('*')
          .maybeSingle()

        if (creatorData) {
          setProfile({
            id: creatorData.id,
            clerk_user_id: clerkUserId,
            username: creatorData.username,
            display_name: creatorData.display_name,
            email: null,
            bio: creatorData.bio,
            avatar_url: creatorData.avatar_url,
            verification_status: 'verified',
            wallet_provider: creatorData.wallet_provider,
            wallet_number: creatorData.wallet_number,
            wallet_last_updated_at: null,
            is_admin: false,
            created_at: creatorData.created_at,
            updated_at: creatorData.updated_at,
          })
        } else {
          // Profil de développement par défaut pour permettre de tester immédiatement
          const cleanName = devUser?.fullName || 'Kalifa'
          setProfile({
            id: clerkUserId,
            clerk_user_id: clerkUserId,
            username: cleanName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            display_name: cleanName,
            email: devUser?.email || null,
            bio: 'Créateur & Porteur de projet sur DONKAI',
            avatar_url: null,
            verification_status: 'verified',
            wallet_provider: 'orange',
            wallet_number: '+223 70 00 00 00',
            wallet_last_updated_at: null,
            is_admin: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      } else if (data) {
        setProfile(data)
      } else {
        const cleanName = devUser?.fullName || 'Kalifa'
        setProfile({
          id: clerkUserId,
          clerk_user_id: clerkUserId,
          username: cleanName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          display_name: cleanName,
          email: devUser?.email || null,
          bio: 'Créateur & Porteur de projet sur DONKAI',
          avatar_url: null,
          verification_status: 'verified',
          wallet_provider: 'orange',
          wallet_number: '+223 70 00 00 00',
          wallet_last_updated_at: null,
          is_admin: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch {
      const cleanName = devUser?.fullName || 'Kalifa'
      setProfile({
        id: clerkUserId,
        clerk_user_id: clerkUserId,
        username: cleanName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        display_name: cleanName,
        email: devUser?.email || null,
        bio: 'Créateur & Porteur de projet sur DONKAI',
        avatar_url: null,
        verification_status: 'verified',
        wallet_provider: 'orange',
        wallet_number: '+223 70 00 00 00',
        wallet_last_updated_at: null,
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (devUser?.id) {
      await fetchProfile(devUser.id)
    }
  }

  const devSignIn = async (email: string, username: string) => {
    const mockClerkId = `dev_user_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    const newUser: AuthUser = {
      id: mockClerkId,
      email: email || `${username}@donkai.local`,
      fullName: username,
      imageUrl: null,
    }
    localStorage.setItem('donkai_dev_user', JSON.stringify(newUser))
    setDevUser(newUser)
    await fetchProfile(mockClerkId)
  }

  const signOut = async () => {
    localStorage.removeItem('donkai_dev_user')
    setDevUser(null)
    setProfile(null)
  }

  useEffect(() => {
    if (devUser?.id) {
      fetchProfile(devUser.id)
    } else {
      setLoading(false)
    }
  }, [devUser?.id])

  return (
    <AuthContext.Provider
      value={{
        user: devUser,
        profile,
        loading,
        isClerkConfigured: false,
        refreshProfile,
        signOut,
        devSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (HAS_VALID_CLERK_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ClerkAuthBridge>{children}</ClerkAuthBridge>
      </ClerkProvider>
    )
  }

  return <LocalDevAuthBridge>{children}</LocalDevAuthBridge>
}

export const useAuth = () => useContext(AuthContext)
