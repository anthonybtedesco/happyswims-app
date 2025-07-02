import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      admin: {
        Row: {
          id: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
        }
      }
      address: {
        Row: {
          id: string
          created_at: string
          address_line: string | null
          city: string | null
          state: string | null
          zip: string | null
          user_id: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          address_line?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          user_id?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          address_line?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          user_id?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      instructor: {
        Row: {
          id: string
          created_at: string
          home_address_id: string | null
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          home_address_id?: string | null
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          home_address_id?: string | null
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
      }
      client: {
        Row: {
          id: string
          created_at: string
          first_name: string | null
          last_name: string | null
          home_address_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          home_address_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          home_address_id?: string | null
          user_id?: string
        }
      }
    }
  }
} 