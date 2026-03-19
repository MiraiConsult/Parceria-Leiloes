import { createClient } from '@supabase/supabase-js'
import { Database } from './types/supabase'

const supabaseUrl = 'https://lyllmxolrvvytibofqmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bGxteG9scnZ2eXRpYm9mcW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjIxNDMsImV4cCI6MjA4MTk5ODE0M30.6StR4BA--Amg6tRPQVLK2WupPkjKtmyHXm83hMJyHaQ'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
})
