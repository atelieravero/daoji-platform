export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          type: 'event' | 'resource' | 'page'
          title_en: string
          title_zh: string
          content_en: Json | null
          content_zh: Json | null
          tags: string[] | null
          start_date: string | null
          end_date: string | null
          published_at: string | null
          sort_order: number | null
          application_form_id: string | null // FK to forms table
          is_published: boolean
          schedule_display_en: string | null
          schedule_display_zh: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }

      forms: {
        Row: {
          id: string
          event_id: string | null // FK to posts
          title: string
          type: 'application' | 'confirmation' | 'auxiliary'
          form_schema: Json // The complex UI builder JSON
          is_published: boolean
          preview_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['forms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['forms']['Insert']>
      }

      submissions: {
        Row: {
          id: string
          event_id: string // FK to posts
          form_id: string // FK to forms
          mobile_number: string | null
          answers: Json // The actual submitted user data mapping to Data Keys
          magic_token: string // The passport connecting forms in Coda
          is_test: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>
      }

      tags: {
        Row: {
          id: string
          slug: string
          name_en: string
          name_zh: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
      }

      admins: {
        Row: {
          id: string
          email: string
          is_super_admin: boolean
          can_manage_posts: boolean
          can_manage_forms: boolean
          can_view_submissions: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admins']['Insert']>
      }
    }
  }
}