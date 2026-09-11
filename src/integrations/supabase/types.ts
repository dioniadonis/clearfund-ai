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
      calendar_items: {
        Row: {
          brief_id: string | null
          channel: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_for: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brief_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_for: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brief_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_for?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_items_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      call_scripts: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          name: string
          script_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          name: string
          script_type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          name?: string
          script_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_tasks: {
        Row: {
          attempts: number
          call_type: string
          completed_at: string | null
          created_at: string
          handoff_state: string
          id: string
          lead_id: string
          max_attempts: number
          outcome: string | null
          scheduled_for: string | null
          script_id: string | null
          status: string
          summary: string | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          call_type?: string
          completed_at?: string | null
          created_at?: string
          handoff_state?: string
          id?: string
          lead_id: string
          max_attempts?: number
          outcome?: string | null
          scheduled_for?: string | null
          script_id?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          call_type?: string
          completed_at?: string | null
          created_at?: string
          handoff_state?: string
          id?: string
          lead_id?: string
          max_attempts?: number
          outcome?: string | null
          scheduled_for?: string | null
          script_id?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_tasks_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "call_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_spend: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          entered_manually: boolean
          id: string
          spend_date: string
          updated_at: string
        }
        Insert: {
          amount?: number
          campaign_id: string
          created_at?: string
          entered_manually?: boolean
          id?: string
          spend_date: string
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          entered_manually?: boolean
          id?: string
          spend_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_spend_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          channel: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          notes: string | null
          offer: string | null
          start_date: string | null
          status: string
          updated_at: string
          utm_campaign: string | null
        }
        Insert: {
          budget?: number | null
          channel?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          offer?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
        }
        Update: {
          budget?: number | null
          channel?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          offer?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
        }
        Relationships: []
      }
      content_briefs: {
        Row: {
          audience: string | null
          brief: string | null
          channel: string | null
          created_at: string
          created_by: string | null
          draft_copy: string | null
          id: string
          objective: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          brief?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          draft_copy?: string | null
          id?: string
          objective?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          brief?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          draft_copy?: string | null
          id?: string
          objective?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creative_assets: {
        Row: {
          asset_type: string
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          asset_type?: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          created_at: string
          display_name: string
          id: string
          notes: string | null
          provider_key: string
          required_setup: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          display_name: string
          id?: string
          notes?: string | null
          provider_key: string
          required_setup?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string
          id?: string
          notes?: string | null
          provider_key?: string
          required_setup?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          lead_id: string
          notes: string | null
          received_at: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          lead_id: string
          notes?: string | null
          received_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          lead_id?: string
          notes?: string | null
          received_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          lead_id: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          lead_id: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          lead_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          application_status: Database["public"]["Enums"]["application_status"]
          business_name: string
          campaign_id: string | null
          consent_at: string | null
          consent_call: boolean
          consent_email: boolean
          consent_sms: boolean
          consent_text_version: string | null
          created_at: string
          document_status: Database["public"]["Enums"]["document_status"]
          email: string
          full_name: string
          funding_need: number | null
          funding_purpose: string | null
          id: string
          landing_page: string | null
          monthly_revenue: number | null
          next_action: string | null
          next_action_due: string | null
          notes: string | null
          opted_out: boolean
          opted_out_at: string | null
          phone: string
          qualification_notes: string | null
          qualification_score: number | null
          referrer: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          time_in_business_months: number | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          application_status?: Database["public"]["Enums"]["application_status"]
          business_name: string
          campaign_id?: string | null
          consent_at?: string | null
          consent_call?: boolean
          consent_email?: boolean
          consent_sms?: boolean
          consent_text_version?: string | null
          created_at?: string
          document_status?: Database["public"]["Enums"]["document_status"]
          email: string
          full_name: string
          funding_need?: number | null
          funding_purpose?: string | null
          id?: string
          landing_page?: string | null
          monthly_revenue?: number | null
          next_action?: string | null
          next_action_due?: string | null
          notes?: string | null
          opted_out?: boolean
          opted_out_at?: string | null
          phone: string
          qualification_notes?: string | null
          qualification_score?: number | null
          referrer?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          time_in_business_months?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          application_status?: Database["public"]["Enums"]["application_status"]
          business_name?: string
          campaign_id?: string | null
          consent_at?: string | null
          consent_call?: boolean
          consent_email?: boolean
          consent_sms?: boolean
          consent_text_version?: string | null
          created_at?: string
          document_status?: Database["public"]["Enums"]["document_status"]
          email?: string
          full_name?: string
          funding_need?: number | null
          funding_purpose?: string | null
          id?: string
          landing_page?: string | null
          monthly_revenue?: number | null
          next_action?: string | null
          next_action_due?: string | null
          notes?: string | null
          opted_out?: boolean
          opted_out_at?: string | null
          phone?: string
          qualification_notes?: string | null
          qualification_score?: number | null
          referrer?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          time_in_business_months?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      qualification_criteria: {
        Row: {
          active: boolean
          comparator: string
          created_at: string
          field: string
          id: string
          label: string
          threshold: number
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          comparator: string
          created_at?: string
          field: string
          id?: string
          label: string
          threshold: number
          updated_at?: string
          weight?: number
        }
        Update: {
          active?: boolean
          comparator?: string
          created_at?: string
          field?: string
          id?: string
          label?: string
          threshold?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_operator: { Args: { _user_id: string }; Returns: boolean }
      operator_update_lead: {
        Args: {
          _event_description: string
          _lead_id: string
          _next_action: string
          _next_action_due: string
          _notes: string
          _stage: Database["public"]["Enums"]["lead_stage"]
        }
        Returns: {
          application_status: Database["public"]["Enums"]["application_status"]
          business_name: string
          campaign_id: string | null
          consent_at: string | null
          consent_call: boolean
          consent_email: boolean
          consent_sms: boolean
          consent_text_version: string | null
          created_at: string
          document_status: Database["public"]["Enums"]["document_status"]
          email: string
          full_name: string
          funding_need: number | null
          funding_purpose: string | null
          id: string
          landing_page: string | null
          monthly_revenue: number | null
          next_action: string | null
          next_action_due: string | null
          notes: string | null
          opted_out: boolean
          opted_out_at: string | null
          phone: string
          qualification_notes: string | null
          qualification_score: number | null
          referrer: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          time_in_business_months: number | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "operator"
      application_status: "not_started" | "in_progress" | "completed"
      document_status: "none" | "requested" | "partial" | "complete"
      lead_stage:
        | "new"
        | "qualification"
        | "nurture"
        | "application"
        | "documents"
        | "submitted"
        | "conditions"
        | "funded"
        | "declined"
        | "lost"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "operator"],
      application_status: ["not_started", "in_progress", "completed"],
      document_status: ["none", "requested", "partial", "complete"],
      lead_stage: [
        "new",
        "qualification",
        "nurture",
        "application",
        "documents",
        "submitted",
        "conditions",
        "funded",
        "declined",
        "lost",
      ],
    },
  },
} as const
