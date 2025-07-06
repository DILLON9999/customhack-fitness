import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          fitness_level: 'beginner' | 'intermediate' | 'pro'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          fitness_level: 'beginner' | 'intermediate' | 'pro'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          fitness_level?: 'beginner' | 'intermediate' | 'pro'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 