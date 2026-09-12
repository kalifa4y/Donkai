import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Donkai: Supabase URL ou clé anonyme manquante dans les variables d’environnement.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      const clerkSession = (window as unknown as { Clerk?: { session?: { getToken: (opts?: { template?: string }) => Promise<string | null> } } })?.Clerk?.session
      const token = clerkSession ? await clerkSession.getToken({ template: 'supabase' }) : null
      const headers = new Headers(options?.headers)
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return fetch(url, {
        ...options,
        headers,
      })
    },
  },
})
