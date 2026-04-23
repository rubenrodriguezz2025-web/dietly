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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_request_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          day_number: number | null
          id: string
          model_version: string
          nutritionist_id: string
          plan_id: string | null
          prompt: string
          request_type: string
          response_summary: string | null
          session_patient_id: string
          tokens_input: number
          tokens_output: number
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          day_number?: number | null
          id?: string
          model_version: string
          nutritionist_id: string
          plan_id?: string | null
          prompt: string
          request_type: string
          response_summary?: string | null
          session_patient_id: string
          tokens_input?: number
          tokens_output?: number
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          day_number?: number | null
          id?: string
          model_version?: string
          nutritionist_id?: string
          plan_id?: string | null
          prompt?: string
          request_type?: string
          response_summary?: string | null
          session_patient_id?: string
          tokens_input?: number
          tokens_output?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_request_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          id: string
          meeting_url: string | null
          notes: string | null
          nutritionist_id: string
          patient_id: string | null
          status: string
          time: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          nutritionist_id: string
          patient_id?: string | null
          status?: string
          time: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string | null
          status?: string
          time?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id: string
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      beta_whitelist: {
        Row: {
          added_at: string | null
          email: string
          id: string
          name: string | null
          notes: string | null
          plan_limit: number | null
        }
        Insert: {
          added_at?: string | null
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          plan_limit?: number | null
        }
        Update: {
          added_at?: string | null
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          plan_limit?: number | null
        }
        Relationships: []
      }
      data_rights_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          nutritionist_id: string
          patient_email_snapshot: string | null
          patient_id: string | null
          patient_name_snapshot: string | null
          request_type: string
          responded_at: string | null
          response_due_at: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          nutritionist_id: string
          patient_email_snapshot?: string | null
          patient_id?: string | null
          patient_name_snapshot?: string | null
          request_type: string
          responded_at?: string | null
          response_due_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          nutritionist_id?: string
          patient_email_snapshot?: string | null
          patient_id?: string | null
          patient_name_snapshot?: string | null
          request_type?: string
          responded_at?: string | null
          response_due_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_rights_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_forms: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          nutritionist_id: string | null
          patient_id: string | null
          token: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          nutritionist_id?: string | null
          patient_id?: string | null
          token?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          nutritionist_id?: string | null
          patient_id?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_forms_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_forms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_reminders: {
        Row: {
          created_at: string | null
          days_interval: number | null
          id: string
          nutritionist_id: string | null
          patient_id: string | null
          remind_at: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          days_interval?: number | null
          id?: string
          nutritionist_id?: string | null
          patient_id?: string | null
          remind_at: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          days_interval?: number | null
          id?: string
          nutritionist_id?: string | null
          patient_id?: string | null
          remind_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_reminders_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_forms: {
        Row: {
          answers: Json
          attached_files: string[] | null
          completed_at: string
          consultation_goal: string | null
          created_at: string
          filled_at: string | null
          filled_by: string | null
          id: string
          nutritionist_id: string | null
          patient_id: string
          why_now: string | null
        }
        Insert: {
          answers?: Json
          attached_files?: string[] | null
          completed_at?: string
          consultation_goal?: string | null
          created_at?: string
          filled_at?: string | null
          filled_by?: string | null
          id?: string
          nutritionist_id?: string | null
          patient_id: string
          why_now?: string | null
        }
        Update: {
          answers?: Json
          attached_files?: string[] | null
          completed_at?: string
          consultation_goal?: string | null
          created_at?: string
          filled_at?: string | null
          filled_by?: string | null
          id?: string
          nutritionist_id?: string | null
          patient_id?: string
          why_now?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_forms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_swaps: {
        Row: {
          alternatives: Json
          created_at: string
          day_number: number
          id: string
          initiated_by: string
          meal_index: number
          notification_sent_at: string | null
          nutritionist_id: string
          original_meal: Json
          patient_id: string
          plan_id: string
          reason: string | null
          reverted_at: string | null
          selected_meal: Json
          status: string
        }
        Insert: {
          alternatives?: Json
          created_at?: string
          day_number: number
          id?: string
          initiated_by?: string
          meal_index: number
          notification_sent_at?: string | null
          nutritionist_id: string
          original_meal: Json
          patient_id: string
          plan_id: string
          reason?: string | null
          reverted_at?: string | null
          selected_meal: Json
          status?: string
        }
        Update: {
          alternatives?: Json
          created_at?: string
          day_number?: number
          id?: string
          initiated_by?: string
          meal_index?: number
          notification_sent_at?: string | null
          nutritionist_id?: string
          original_meal?: Json
          patient_id?: string
          plan_id?: string
          reason?: string | null
          reverted_at?: string | null
          selected_meal?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_swaps_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_swaps_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_swaps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          claude_tokens_used: number | null
          content: Json | null
          created_at: string
          id: string
          nutritionist_id: string
          patient_id: string
          patient_token: string
          pdf_generated_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["plan_status_type"]
          updated_at: string
          validation_acked_blocks: string[]
          week_start_date: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          claude_tokens_used?: number | null
          content?: Json | null
          created_at?: string
          id?: string
          nutritionist_id: string
          patient_id: string
          patient_token?: string
          pdf_generated_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["plan_status_type"]
          updated_at?: string
          validation_acked_blocks?: string[]
          week_start_date: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          claude_tokens_used?: number | null
          content?: Json | null
          created_at?: string
          id?: string
          nutritionist_id?: string
          patient_id?: string
          patient_token?: string
          pdf_generated_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["plan_status_type"]
          updated_at?: string
          validation_acked_blocks?: string[]
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          consent_text_version: string
          consent_type: string
          created_at: string
          granted_at: string
          id: string
          ip_address: string | null
          nutritionist_id: string
          patient_id: string
          revoked_at: string | null
        }
        Insert: {
          consent_text_version: string
          consent_type?: string
          created_at?: string
          granted_at?: string
          id?: string
          ip_address?: string | null
          nutritionist_id: string
          patient_id: string
          revoked_at?: string | null
        }
        Update: {
          consent_text_version?: string
          consent_type?: string
          created_at?: string
          granted_at?: string
          id?: string
          ip_address?: string | null
          nutritionist_id?: string
          patient_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_progress: {
        Row: {
          body_fat_pct: number | null
          created_at: string | null
          id: string
          muscle_mass_kg: number | null
          notes: string | null
          nutritionist_id: string
          patient_id: string
          recorded_at: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          created_at?: string | null
          id?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          nutritionist_id: string
          patient_id: string
          recorded_at?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          created_at?: string | null
          id?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          nutritionist_id?: string
          patient_id?: string
          recorded_at?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_progress_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_progress_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          activity_level:
            | Database["public"]["Enums"]["activity_level_type"]
            | null
          allergies: string | null
          allow_meal_swaps: boolean
          cooking_preference: string | null
          created_at: string
          date_of_birth: string | null
          dietary_restrictions: string[] | null
          email: string | null
          goal: Database["public"]["Enums"]["patient_goal_type"] | null
          height_cm: number | null
          id: string
          intake_token: string | null
          intolerances: string | null
          medical_notes: string | null
          name: string
          nutritionist_id: string
          phone: string | null
          preferences: string | null
          sex: string | null
          sport_type: string | null
          supplementation: string | null
          tdee: number | null
          tmb: number | null
          training_days_per_week: number | null
          training_schedule: string | null
          training_time: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?:
            | Database["public"]["Enums"]["activity_level_type"]
            | null
          allergies?: string | null
          allow_meal_swaps?: boolean
          cooking_preference?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          goal?: Database["public"]["Enums"]["patient_goal_type"] | null
          height_cm?: number | null
          id?: string
          intake_token?: string | null
          intolerances?: string | null
          medical_notes?: string | null
          name: string
          nutritionist_id: string
          phone?: string | null
          preferences?: string | null
          sex?: string | null
          sport_type?: string | null
          supplementation?: string | null
          tdee?: number | null
          tmb?: number | null
          training_days_per_week?: number | null
          training_schedule?: string | null
          training_time?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?:
            | Database["public"]["Enums"]["activity_level_type"]
            | null
          allergies?: string | null
          allow_meal_swaps?: boolean
          cooking_preference?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          goal?: Database["public"]["Enums"]["patient_goal_type"] | null
          height_cm?: number | null
          id?: string
          intake_token?: string | null
          intolerances?: string | null
          medical_notes?: string | null
          name?: string
          nutritionist_id?: string
          phone?: string | null
          preferences?: string | null
          sex?: string | null
          sport_type?: string | null
          supplementation?: string | null
          tdee?: number | null
          tmb?: number | null
          training_days_per_week?: number | null
          training_schedule?: string | null
          training_time?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      plan_access_attempts: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          plan_id?: string
        }
        Relationships: []
      }
      plan_generations: {
        Row: {
          content: Json | null
          created_at: string
          day_number: number
          error: string | null
          id: string
          nutritionist_id: string
          plan_id: string
          status: Database["public"]["Enums"]["generation_status_type"]
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          day_number: number
          error?: string | null
          id?: string
          nutritionist_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["generation_status_type"]
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          day_number?: number
          error?: string | null
          id?: string
          nutritionist_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["generation_status_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_generations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_views: {
        Row: {
          first_opened_at: string | null
          id: string
          ip_address: string | null
          last_opened_at: string | null
          open_count: number | null
          patient_token: string | null
          plan_id: string | null
        }
        Insert: {
          first_opened_at?: string | null
          id?: string
          ip_address?: string | null
          last_opened_at?: string | null
          open_count?: number | null
          patient_token?: string | null
          plan_id?: string | null
        }
        Update: {
          first_opened_at?: string | null
          id?: string
          ip_address?: string | null
          last_opened_at?: string | null
          open_count?: number | null
          patient_token?: string | null
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_views_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          brand_settings_visited_at: string | null
          clinic_name: string | null
          college_number: string | null
          created_at: string
          font_preference: string | null
          full_name: string
          id: string
          logo_url: string | null
          onboarding_completed_at: string | null
          primary_color: string | null
          profile_photo_url: string | null
          show_macros: boolean | null
          show_shopping_list: boolean | null
          signature_url: string | null
          specialty: Database["public"]["Enums"]["specialty_type"]
          stripe_customer_id: string | null
          subscription_status: string | null
          updated_at: string
          upsell_email_sent_at: string | null
          welcome_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          brand_settings_visited_at?: string | null
          clinic_name?: string | null
          college_number?: string | null
          created_at?: string
          font_preference?: string | null
          full_name: string
          id: string
          logo_url?: string | null
          onboarding_completed_at?: string | null
          primary_color?: string | null
          profile_photo_url?: string | null
          show_macros?: boolean | null
          show_shopping_list?: boolean | null
          signature_url?: string | null
          specialty?: Database["public"]["Enums"]["specialty_type"]
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          upsell_email_sent_at?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          brand_settings_visited_at?: string | null
          clinic_name?: string | null
          college_number?: string | null
          created_at?: string
          font_preference?: string | null
          full_name?: string
          id?: string
          logo_url?: string | null
          onboarding_completed_at?: string | null
          primary_color?: string | null
          profile_photo_url?: string | null
          show_macros?: boolean | null
          show_shopping_list?: boolean | null
          signature_url?: string | null
          specialty?: Database["public"]["Enums"]["specialty_type"]
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          upsell_email_sent_at?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          carbs_g_per_serving: number | null
          category: string | null
          created_at: string | null
          fat_g_per_serving: number | null
          id: string
          ingredients: Json | null
          instructions: string | null
          name: string
          notes: string | null
          nutritionist_id: string | null
          protein_g_per_serving: number | null
          servings: number | null
          updated_at: string | null
          values_source: string | null
        }
        Insert: {
          calories_per_serving?: number | null
          carbs_g_per_serving?: number | null
          category?: string | null
          created_at?: string | null
          fat_g_per_serving?: number | null
          id?: string
          ingredients?: Json | null
          instructions?: string | null
          name: string
          notes?: string | null
          nutritionist_id?: string | null
          protein_g_per_serving?: number | null
          servings?: number | null
          updated_at?: string | null
          values_source?: string | null
        }
        Update: {
          calories_per_serving?: number | null
          carbs_g_per_serving?: number | null
          category?: string | null
          created_at?: string | null
          fat_g_per_serving?: number | null
          id?: string
          ingredients?: Json | null
          instructions?: string | null
          name?: string
          notes?: string | null
          nutritionist_id?: string | null
          protein_g_per_serving?: number | null
          servings?: number | null
          updated_at?: string | null
          values_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_access_attempts: { Args: never; Returns: undefined }
      get_plan_by_patient_token: {
        Args: { p_token: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          claude_tokens_used: number | null
          content: Json | null
          created_at: string
          id: string
          nutritionist_id: string
          patient_id: string
          patient_token: string
          pdf_generated_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["plan_status_type"]
          updated_at: string
          validation_acked_blocks: string[]
          week_start_date: string
        }[]
        SetofOptions: {
          from: "*"
          to: "nutrition_plans"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_audit_read: {
        Args: {
          p_metadata?: Json
          p_resource_id: string
          p_resource_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_level_type:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
        | "extra_active"
      generation_status_type: "pending" | "generating" | "completed" | "failed"
      patient_goal_type:
        | "weight_loss"
        | "weight_gain"
        | "maintenance"
        | "muscle_gain"
        | "health"
      plan_status_type: "draft" | "approved" | "sent" | "generating" | "error"
      specialty_type: "weight_loss" | "sports" | "clinical" | "tca" | "general"
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
    Enums: {
      activity_level_type: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extra_active",
      ],
      generation_status_type: ["pending", "generating", "completed", "failed"],
      patient_goal_type: [
        "weight_loss",
        "weight_gain",
        "maintenance",
        "muscle_gain",
        "health",
      ],
      plan_status_type: ["draft", "approved", "sent", "generating", "error"],
      specialty_type: ["weight_loss", "sports", "clinical", "tca", "general"],
    },
  },
} as const
