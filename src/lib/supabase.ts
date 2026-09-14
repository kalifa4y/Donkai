import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Donkai: Supabase URL or anon key missing in environment variables.')
}

// Get Clerk token via useAuth hook at component level,
// this global config serves as fallback for direct requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options: RequestInit = {}) => {
      // Try to get token from Clerk through window
      const clerk = (window as unknown as { Clerk?: { session?: { getToken: (opts?: { template?: string }) => Promise<string | null> } } })?.Clerk
      const token = clerk?.session ? await clerk.session.getToken({ template: 'supabase' }) : null
      const headers = new Headers(options.headers as HeadersInit)
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