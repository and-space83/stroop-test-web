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
      android_motion_samples: {
        Row: {
          created_at: string
          id: string
          motion_energy: number | null
          sample_count: number
          sample_rate_hz: number | null
          samples: Json
          trial_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          motion_energy?: number | null
          sample_count: number
          sample_rate_hz?: number | null
          samples: Json
          trial_id: string
        }
        Update: {
          created_at?: string
          id?: string
          motion_energy?: number | null
          sample_count?: number
          sample_rate_hz?: number | null
          samples?: Json
          trial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "android_motion_samples_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: true
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      android_touch_events: {
        Row: {
          created_at: string
          event_count: number
          events: Json
          id: string
          pressure_max: number | null
          pressure_mean: number | null
          size_mean: number | null
          trial_id: string
        }
        Insert: {
          created_at?: string
          event_count: number
          events: Json
          id?: string
          pressure_max?: number | null
          pressure_mean?: number | null
          size_mean?: number | null
          trial_id: string
        }
        Update: {
          created_at?: string
          event_count?: number
          events?: Json
          id?: string
          pressure_max?: number | null
          pressure_mean?: number | null
          size_mean?: number | null
          trial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "android_touch_events_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: true
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          age: number
          auth_provider: string
          auth_user_id: string
          created_at: string
          email: string | null
          gender: string
          handedness: string
          id: string
          is_guest: boolean
          updated_at: string
        }
        Insert: {
          age: number
          auth_provider: string
          auth_user_id: string
          created_at?: string
          email?: string | null
          gender: string
          handedness: string
          id?: string
          is_guest?: boolean
          updated_at?: string
        }
        Update: {
          age?: number
          auth_provider?: string
          auth_user_id?: string
          created_at?: string
          email?: string | null
          gender?: string
          handedness?: string
          id?: string
          is_guest?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          average_rt: number | null
          congruent_avg_rt: number | null
          correct_count: number | null
          created_at: string
          device_info: Json | null
          finished_at: string | null
          id: string
          incongruent_avg_rt: number | null
          is_completed: boolean
          mode: string
          note: string | null
          participant_id: string
          platform: string
          started_at: string
          total_trials: number | null
        }
        Insert: {
          average_rt?: number | null
          congruent_avg_rt?: number | null
          correct_count?: number | null
          created_at?: string
          device_info?: Json | null
          finished_at?: string | null
          id?: string
          incongruent_avg_rt?: number | null
          is_completed?: boolean
          mode: string
          note?: string | null
          participant_id: string
          platform: string
          started_at: string
          total_trials?: number | null
        }
        Update: {
          average_rt?: number | null
          congruent_avg_rt?: number | null
          correct_count?: number | null
          created_at?: string
          device_info?: Json | null
          finished_at?: string | null
          id?: string
          incongruent_avg_rt?: number | null
          is_completed?: boolean
          mode?: string
          note?: string | null
          participant_id?: string
          platform?: string
          started_at?: string
          total_trials?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      trials: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          reaction_time_ms: number
          response: string
          session_id: string
          stimulus: Json
          stimulus_shown_at: string
          trial_index: number
          trial_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          reaction_time_ms: number
          response: string
          session_id: string
          stimulus: Json
          stimulus_shown_at: string
          trial_index: number
          trial_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          reaction_time_ms?: number
          response?: string
          session_id?: string
          stimulus?: Json
          stimulus_shown_at?: string
          trial_index?: number
          trial_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_clicks: {
        Row: {
          created_at: string
          event_count: number
          events: Json
          id: string
          trial_id: string
        }
        Insert: {
          created_at?: string
          event_count: number
          events: Json
          id?: string
          trial_id: string
        }
        Update: {
          created_at?: string
          event_count?: number
          events?: Json
          id?: string
          trial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_clicks_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      web_keystrokes: {
        Row: {
          created_at: string
          event_count: number
          events: Json
          id: string
          trial_id: string
        }
        Insert: {
          created_at?: string
          event_count: number
          events: Json
          id?: string
          trial_id: string
        }
        Update: {
          created_at?: string
          event_count?: number
          events?: Json
          id?: string
          trial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_keystrokes_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      web_mouse_paths: {
        Row: {
          created_at: string
          id: string
          jitter: number | null
          max_speed: number | null
          path_length: number | null
          point_count: number
          points: Json
          trial_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jitter?: number | null
          max_speed?: number | null
          path_length?: number | null
          point_count: number
          points: Json
          trial_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jitter?: number | null
          max_speed?: number | null
          path_length?: number | null
          point_count?: number
          points?: Json
          trial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_mouse_paths_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: true
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
