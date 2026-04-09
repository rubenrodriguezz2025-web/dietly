export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      ai_request_logs: {
        Row: {
          id: string;
          nutritionist_id: string;
          session_patient_id: string;
          plan_id: string | null;
          model_version: string;
          request_type: string;
          day_number: number | null;
          prompt: string;
          response_summary: string | null;
          tokens_input: number;
          tokens_output: number;
          cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nutritionist_id: string;
          session_patient_id: string;
          plan_id?: string | null;
          model_version: string;
          request_type: string;
          day_number?: number | null;
          prompt: string;
          response_summary?: string | null;
          tokens_input?: number;
          tokens_output?: number;
          cost_usd?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nutritionist_id?: string;
          session_patient_id?: string;
          plan_id?: string | null;
          model_version?: string;
          request_type?: string;
          day_number?: number | null;
          prompt?: string;
          response_summary?: string | null;
          tokens_input?: number;
          tokens_output?: number;
          cost_usd?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          nutritionist_id: string;
          patient_id: string | null;
          date: string;
          time: string;
          type: string;
          notes: string | null;
          status: string;
          meeting_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nutritionist_id: string;
          patient_id?: string | null;
          date: string;
          time: string;
          type?: string;
          notes?: string | null;
          status?: string;
          meeting_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nutritionist_id?: string;
          patient_id?: string | null;
          date?: string;
          time?: string;
          type?: string;
          notes?: string | null;
          status?: string;
          meeting_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      beta_whitelist: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          added_at: string | null;
          notes: string | null;
          plan_limit: number | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          added_at?: string | null;
          notes?: string | null;
          plan_limit?: number | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          added_at?: string | null;
          notes?: string | null;
          plan_limit?: number | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          stripe_customer_id: string | null;
        };
        Insert: {
          id: string;
          stripe_customer_id?: string | null;
        };
        Update: {
          id?: string;
          stripe_customer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      data_rights_requests: {
        Row: {
          id: string;
          patient_id: string | null;
          nutritionist_id: string;
          request_type: string;
          status: string;
          patient_name_snapshot: string | null;
          patient_email_snapshot: string | null;
          notes: string | null;
          response_due_at: string;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          nutritionist_id: string;
          request_type: string;
          status?: string;
          patient_name_snapshot?: string | null;
          patient_email_snapshot?: string | null;
          notes?: string | null;
          response_due_at?: string;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          nutritionist_id?: string;
          request_type?: string;
          status?: string;
          patient_name_snapshot?: string | null;
          patient_email_snapshot?: string | null;
          notes?: string | null;
          response_due_at?: string;
          responded_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      followup_forms: {
        Row: {
          id: string;
          patient_id: string;
          nutritionist_id: string;
          created_at: string;
          completed_at: string | null;
          answers: Json | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutritionist_id: string;
          created_at?: string;
          completed_at?: string | null;
          answers?: Json | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutritionist_id?: string;
          created_at?: string;
          completed_at?: string | null;
          answers?: Json | null;
        };
        Relationships: [];
      };
      followup_reminders: {
        Row: {
          id: string;
          patient_id: string;
          nutritionist_id: string;
          remind_at: string;
          status: string;
          days_interval: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutritionist_id: string;
          remind_at: string;
          status?: string;
          days_interval?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutritionist_id?: string;
          remind_at?: string;
          status?: string;
          days_interval?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      intake_forms: {
        Row: {
          id: string;
          patient_id: string;
          nutritionist_id: string | null;
          answers: Json;
          completed_at: string;
          created_at: string;
          filled_by: string | null;
          filled_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutritionist_id?: string | null;
          answers?: Json;
          completed_at?: string;
          created_at?: string;
          filled_by?: string | null;
          filled_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutritionist_id?: string | null;
          answers?: Json;
          completed_at?: string;
          created_at?: string;
          filled_by?: string | null;
          filled_at?: string | null;
        };
        Relationships: [];
      };
      nutrition_plans: {
        Row: {
          id: string;
          nutritionist_id: string;
          patient_id: string;
          status: Database['public']['Enums']['plan_status_type'];
          week_start_date: string;
          content: Json | null;
          patient_token: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
          approved_at: string | null;
          approved_by: string | null;
          generated_at: string | null;
          ai_model: string | null;
          validation_acked_blocks: string[];
        };
        Insert: {
          id?: string;
          nutritionist_id: string;
          patient_id: string;
          status?: Database['public']['Enums']['plan_status_type'];
          week_start_date: string;
          content?: Json | null;
          patient_token?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          generated_at?: string | null;
          ai_model?: string | null;
          validation_acked_blocks?: string[];
        };
        Update: {
          id?: string;
          nutritionist_id?: string;
          patient_id?: string;
          status?: Database['public']['Enums']['plan_status_type'];
          week_start_date?: string;
          content?: Json | null;
          patient_token?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          generated_at?: string | null;
          ai_model?: string | null;
          validation_acked_blocks?: string[];
        };
        Relationships: [];
      };
      patient_consents: {
        Row: {
          id: string;
          patient_id: string;
          nutritionist_id: string;
          consent_type: string;
          granted_at: string;
          revoked_at: string | null;
          ip_address: string | null;
          consent_text_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutritionist_id: string;
          consent_type?: string;
          granted_at?: string;
          revoked_at?: string | null;
          ip_address?: string | null;
          consent_text_version?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutritionist_id?: string;
          consent_type?: string;
          granted_at?: string;
          revoked_at?: string | null;
          ip_address?: string | null;
          consent_text_version?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      patient_progress: {
        Row: {
          id: string;
          patient_id: string;
          nutritionist_id: string;
          recorded_at: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          muscle_mass_kg: number | null;
          waist_cm: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          nutritionist_id: string;
          recorded_at?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          muscle_mass_kg?: number | null;
          waist_cm?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          nutritionist_id?: string;
          recorded_at?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          muscle_mass_kg?: number | null;
          waist_cm?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          nutritionist_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          sex: string | null;
          weight_kg: number | null;
          height_cm: number | null;
          activity_level: Database['public']['Enums']['activity_level_type'] | null;
          goal: Database['public']['Enums']['patient_goal_type'] | null;
          dietary_restrictions: string[] | null;
          allergies: string | null;
          intolerances: string | null;
          preferences: string | null;
          medical_notes: string | null;
          tmb: number | null;
          tdee: number | null;
          intake_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nutritionist_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          sex?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          activity_level?: Database['public']['Enums']['activity_level_type'] | null;
          goal?: Database['public']['Enums']['patient_goal_type'] | null;
          dietary_restrictions?: string[] | null;
          allergies?: string | null;
          intolerances?: string | null;
          preferences?: string | null;
          medical_notes?: string | null;
          tmb?: number | null;
          tdee?: number | null;
          intake_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nutritionist_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          sex?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          activity_level?: Database['public']['Enums']['activity_level_type'] | null;
          goal?: Database['public']['Enums']['patient_goal_type'] | null;
          dietary_restrictions?: string[] | null;
          allergies?: string | null;
          intolerances?: string | null;
          preferences?: string | null;
          medical_notes?: string | null;
          tmb?: number | null;
          tdee?: number | null;
          intake_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_access_attempts: {
        Row: {
          id: string;
          ip_address: string;
          plan_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ip_address: string;
          plan_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ip_address?: string;
          plan_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      plan_generations: {
        Row: {
          id: string;
          plan_id: string;
          nutritionist_id: string;
          day_number: number;
          status: Database['public']['Enums']['generation_status_type'];
          content: Json | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          nutritionist_id: string;
          day_number: number;
          status?: Database['public']['Enums']['generation_status_type'];
          content?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          nutritionist_id?: string;
          day_number?: number;
          status?: Database['public']['Enums']['generation_status_type'];
          content?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_views: {
        Row: {
          id: string;
          plan_id: string | null;
          patient_token: string | null;
          first_opened_at: string | null;
          last_opened_at: string | null;
          open_count: number | null;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          plan_id?: string | null;
          patient_token?: string | null;
          first_opened_at?: string | null;
          last_opened_at?: string | null;
          open_count?: number | null;
          ip_address?: string | null;
        };
        Update: {
          id?: string;
          plan_id?: string | null;
          patient_token?: string | null;
          first_opened_at?: string | null;
          last_opened_at?: string | null;
          open_count?: number | null;
          ip_address?: string | null;
        };
        Relationships: [];
      };
      prices: {
        Row: {
          active: boolean | null;
          currency: string | null;
          description: string | null;
          id: string;
          interval: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count: number | null;
          metadata: Json | null;
          product_id: string | null;
          trial_period_days: number | null;
          type: Database['public']['Enums']['pricing_type'] | null;
          unit_amount: number | null;
        };
        Insert: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id: string;
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database['public']['Enums']['pricing_type'] | null;
          unit_amount?: number | null;
        };
        Update: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database['public']['Enums']['pricing_type'] | null;
          unit_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      products: {
        Row: {
          active: boolean | null;
          description: string | null;
          id: string;
          image: string | null;
          metadata: Json | null;
          name: string | null;
        };
        Insert: {
          active?: boolean | null;
          description?: string | null;
          id: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
        Update: {
          active?: boolean | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          clinic_name: string | null;
          specialty: Database['public']['Enums']['specialty_type'];
          created_at: string;
          updated_at: string;
          subscription_status: string | null;
          logo_url: string | null;
          college_number: string | null;
          signature_url: string | null;
          onboarding_completed_at: string | null;
          show_macros: boolean | null;
          show_shopping_list: boolean | null;
          welcome_message: string | null;
          font_preference: string | null;
          profile_photo_url: string | null;
          brand_settings_visited_at: string | null;
          ai_literacy_acknowledged_at: string | null;
          primary_color: string | null;
          stripe_customer_id: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          clinic_name?: string | null;
          specialty?: Database['public']['Enums']['specialty_type'];
          created_at?: string;
          updated_at?: string;
          subscription_status?: string | null;
          logo_url?: string | null;
          college_number?: string | null;
          signature_url?: string | null;
          onboarding_completed_at?: string | null;
          show_macros?: boolean | null;
          show_shopping_list?: boolean | null;
          welcome_message?: string | null;
          font_preference?: string | null;
          profile_photo_url?: string | null;
          brand_settings_visited_at?: string | null;
          ai_literacy_acknowledged_at?: string | null;
          primary_color?: string | null;
          stripe_customer_id?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          clinic_name?: string | null;
          specialty?: Database['public']['Enums']['specialty_type'];
          created_at?: string;
          updated_at?: string;
          subscription_status?: string | null;
          logo_url?: string | null;
          college_number?: string | null;
          signature_url?: string | null;
          onboarding_completed_at?: string | null;
          show_macros?: boolean | null;
          show_shopping_list?: boolean | null;
          welcome_message?: string | null;
          font_preference?: string | null;
          profile_photo_url?: string | null;
          brand_settings_visited_at?: string | null;
          ai_literacy_acknowledged_at?: string | null;
          primary_color?: string | null;
          stripe_customer_id?: string | null;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          nutritionist_id: string | null;
          name: string;
          category: string | null;
          servings: number | null;
          ingredients: Json | null;
          instructions: string | null;
          notes: string | null;
          calories_per_serving: number | null;
          protein_g_per_serving: number | null;
          carbs_g_per_serving: number | null;
          fat_g_per_serving: number | null;
          values_source: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nutritionist_id?: string | null;
          name: string;
          category?: string | null;
          servings?: number | null;
          ingredients?: Json | null;
          instructions?: string | null;
          notes?: string | null;
          calories_per_serving?: number | null;
          protein_g_per_serving?: number | null;
          carbs_g_per_serving?: number | null;
          fat_g_per_serving?: number | null;
          values_source?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nutritionist_id?: string | null;
          name?: string;
          category?: string | null;
          servings?: number | null;
          ingredients?: Json | null;
          instructions?: string | null;
          notes?: string | null;
          calories_per_serving?: number | null;
          protein_g_per_serving?: number | null;
          carbs_g_per_serving?: number | null;
          fat_g_per_serving?: number | null;
          values_source?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at: string | null;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created: string;
          current_period_end: string;
          current_period_start: string;
          ended_at: string | null;
          id: string;
          metadata: Json | null;
          price_id: string | null;
          quantity: number | null;
          status: Database['public']['Enums']['subscription_status'] | null;
          trial_end: string | null;
          trial_start: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id: string;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_price_id_fkey';
            columns: ['price_id'];
            isOneToOne: false;
            referencedRelation: 'prices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          billing_address: Json | null;
          full_name: string | null;
          id: string;
          payment_method: Json | null;
        };
        Insert: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id: string;
          payment_method?: Json | null;
        };
        Update: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id?: string;
          payment_method?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      append_validation_ack: {
        Args: { p_plan_id: string; p_nutritionist_id: string; p_code: string };
        Returns: undefined;
      };
    };
    Enums: {
      activity_level_type: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
      generation_status_type: 'pending' | 'generating' | 'completed' | 'failed';
      patient_goal_type: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'health';
      plan_status_type: 'draft' | 'approved' | 'sent' | 'generating' | 'error';
      pricing_plan_interval: 'day' | 'week' | 'month' | 'year';
      pricing_type: 'one_time' | 'recurring';
      specialty_type: 'weight_loss' | 'sports' | 'clinical' | 'general';
      subscription_status:
        | 'trialing'
        | 'active'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid'
        | 'paused';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] & Database['public']['Views'])
  ? (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never;
