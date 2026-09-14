import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Donkai: Supabase URL or anon key missing in environment variables.')
}

// Client Supabase officiel avec gestion native des sessions et de l'authentification
export const supabase = createClient(supabaseUrl, supabaseAnonKey)