export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          alt_text_en: string | null
          alt_text_zh: string | null
          created_at: string
          created_by: string | null
          file_name: string
          file_size_bytes: number
          file_url: string
          height: number | null
          id: string
          mime_type: string
          s3_key: string
          width: number | null
        }
        Insert: {
          alt_text_en?: string | null
          alt_text_zh?: string | null
          created_at?: string
          created_by?: string | null
          file_name: string
          file_size_bytes: number
          file_url: string
          height?: number | null
          id?: string
          mime_type: string
          s3_key: string
          width?: number | null
        }
        Update: {
          alt_text_en?: string | null
          alt_text_zh?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_size_bytes?: number
          file_url?: string
          height?: number | null
          id?: string
          mime_type?: string
          s3_key?: string
          width?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          actor_email: string
          actor_id: string | null
          actor_name: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          record_label: string | null
          table_name: string
        }
        Insert: {
          actor_email?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          record_label?: string | null
          table_name: string
        }
        Update: {
          actor_email?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          record_label?: string | null
          table_name?: string
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          body_en: string | null
          body_zh: string
          cover_asset_id: string | null
          created_at: string
          event_id: string | null
          id: string
          is_in_feed: boolean
          is_pinned_in_feed: boolean
          published_at: string | null
          short_id: string
          slug: string | null
          status: string
          title_en: string | null
          title_zh: string
          type: string
          updated_at: string
        }
        Insert: {
          body_en?: string | null
          body_zh?: string
          cover_asset_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_in_feed?: boolean
          is_pinned_in_feed?: boolean
          published_at?: string | null
          short_id?: string
          slug?: string | null
          status?: string
          title_en?: string | null
          title_zh: string
          type?: string
          updated_at?: string
        }
        Update: {
          body_en?: string | null
          body_zh?: string
          cover_asset_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_in_feed?: boolean
          is_pinned_in_feed?: boolean
          published_at?: string | null
          short_id?: string
          slug?: string | null
          status?: string
          title_en?: string | null
          title_zh?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_asset_id: string | null
          code: string
          created_at: string
          end_date: string
          id: string
          linked_form_id: string | null
          location_type: string
          registration_status: string
          short_id: string
          slug: string | null
          start_date: string
          status: string
          summary_en: string | null
          summary_zh: string | null
          title_en: string | null
          title_zh: string
          updated_at: string
          venue_details_en: string | null
          venue_details_zh: string | null
        }
        Insert: {
          banner_asset_id?: string | null
          code?: string
          created_at?: string
          end_date: string
          id?: string
          linked_form_id?: string | null
          location_type?: string
          registration_status?: string
          short_id?: string
          slug?: string | null
          start_date: string
          status?: string
          summary_en?: string | null
          summary_zh?: string | null
          title_en?: string | null
          title_zh: string
          updated_at?: string
          venue_details_en?: string | null
          venue_details_zh?: string | null
        }
        Update: {
          banner_asset_id?: string | null
          code?: string
          created_at?: string
          end_date?: string
          id?: string
          linked_form_id?: string | null
          location_type?: string
          registration_status?: string
          short_id?: string
          slug?: string | null
          start_date?: string
          status?: string
          summary_en?: string | null
          summary_zh?: string | null
          title_en?: string | null
          title_zh?: string
          updated_at?: string
          venue_details_en?: string | null
          venue_details_zh?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_banner_asset_id_fkey"
            columns: ["banner_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_linked_form_id_fkey"
            columns: ["linked_form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_followup: boolean
          schema: Json
          slug: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_followup?: boolean
          schema?: Json
          slug?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_followup?: boolean
          schema?: Json
          slug?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          author_speaker_en: string | null
          author_speaker_zh: string | null
          cover_asset_id: string | null
          created_at: string
          description_en: string | null
          description_zh: string | null
          external_url: string | null
          id: string
          is_featured: boolean
          short_id: string
          slug: string | null
          source_type: string
          status: string
          target_asset_id: string | null
          target_page_id: string | null
          title_en: string | null
          title_zh: string
          updated_at: string
        }
        Insert: {
          author_speaker_en?: string | null
          author_speaker_zh?: string | null
          cover_asset_id?: string | null
          created_at?: string
          description_en?: string | null
          description_zh?: string | null
          external_url?: string | null
          id?: string
          is_featured?: boolean
          short_id?: string
          slug?: string | null
          source_type: string
          status?: string
          target_asset_id?: string | null
          target_page_id?: string | null
          title_en?: string | null
          title_zh: string
          updated_at?: string
        }
        Update: {
          author_speaker_en?: string | null
          author_speaker_zh?: string | null
          cover_asset_id?: string | null
          created_at?: string
          description_en?: string | null
          description_zh?: string | null
          external_url?: string | null
          id?: string
          is_featured?: boolean
          short_id?: string
          slug?: string | null
          source_type?: string
          status?: string
          target_asset_id?: string | null
          target_page_id?: string | null
          title_en?: string | null
          title_zh?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_target_asset_id_fkey"
            columns: ["target_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_target_page_id_fkey"
            columns: ["target_page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          applicant_seq_num: number | null
          applicant_token: string
          created_at: string
          event_id: string
          form_id: string
          id: string
          is_processed: boolean | null
          is_test: boolean | null
          response: Json
        }
        Insert: {
          applicant_seq_num?: number | null
          applicant_token: string
          created_at?: string
          event_id: string
          form_id: string
          id?: string
          is_processed?: boolean | null
          is_test?: boolean | null
          response?: Json
        }
        Update: {
          applicant_seq_num?: number | null
          applicant_token?: string
          created_at?: string
          event_id?: string
          form_id?: string
          id?: string
          is_processed?: boolean | null
          is_test?: boolean | null
          response?: Json
        }
        Relationships: [
          {
            foreignKeyName: "submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      taggables: {
        Row: {
          created_at: string
          tag_id: string
          taggable_id: string
          taggable_type: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          taggable_id: string
          taggable_type: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          taggable_id?: string
          taggable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "taggables_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          is_pillar: boolean
          name_en: string | null
          name_zh: string
          short_id: string
          slug: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_pillar?: boolean
          name_en?: string | null
          name_zh: string
          short_id?: string
          slug?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_pillar?: boolean
          name_en?: string | null
          name_zh?: string
          short_id?: string
          slug?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          display_name: string
          email: string
          id: string
          roles: string[] | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          email: string
          id: string
          roles?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          roles?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nanoid: { Args: { alphabet?: string; size?: number }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
