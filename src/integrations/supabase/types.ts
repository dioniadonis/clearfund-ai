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
      agent_agreements: {
        Row: {
          accepted_at: string
          agent_id: string
          id: string
          ip: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          agent_id: string
          id?: string
          ip?: string | null
          version: string
        }
        Update: {
          accepted_at?: string
          agent_id?: string
          id?: string
          ip?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_agreements_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agent_applications: {
        Row: {
          city: string | null
          created_at: string
          crm_lead_id: string | null
          email: string
          experience: string
          find_owners: string
          full_name: string
          id: string
          passed: boolean
          phone: string | null
          quiz_answers: Json
          quiz_score: number
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          crm_lead_id?: string | null
          email: string
          experience: string
          find_owners: string
          full_name: string
          id?: string
          passed: boolean
          phone?: string | null
          quiz_answers?: Json
          quiz_score: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          crm_lead_id?: string | null
          email?: string
          experience?: string
          find_owners?: string
          full_name?: string
          id?: string
          passed?: boolean
          phone?: string | null
          quiz_answers?: Json
          quiz_score?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_applications_crm_lead_id_fkey"
            columns: ["crm_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_payouts: {
        Row: {
          agent_amount: number
          agent_id: string
          agent_percent: number
          clearfund_commission: number
          created_at: string
          id: string
          lead_id: string
          paid_at: string | null
          payout_basis: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_amount: number
          agent_id: string
          agent_percent: number
          clearfund_commission: number
          created_at?: string
          id?: string
          lead_id: string
          paid_at?: string | null
          payout_basis?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_amount?: number
          agent_id?: string
          agent_percent?: number
          clearfund_commission?: number
          created_at?: string
          id?: string
          lead_id?: string
          paid_at?: string | null
          payout_basis?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_payouts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agent_payouts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_settings: {
        Row: {
          assigned_payout_percent: number
          auto_assign: boolean
          payout_percent: number
          referral_payout_percent: number
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_payout_percent?: number
          auto_assign?: boolean
          payout_percent?: number
          referral_payout_percent?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_payout_percent?: number
          auto_assign?: boolean
          payout_percent?: number
          referral_payout_percent?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      agent_training_progress: {
        Row: {
          agent_id: string
          completed_at: string
          id: string
          section_key: string
        }
        Insert: {
          agent_id: string
          completed_at?: string
          id?: string
          section_key: string
        }
        Update: {
          agent_id?: string
          completed_at?: string
          id?: string
          section_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_training_progress_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agents: {
        Row: {
          active: boolean
          application_id: string | null
          assigned_payout_percent: number | null
          created_at: string
          email: string
          full_name: string
          last_assigned_at: string | null
          payout_percent: number | null
          referral_code: string
          referral_payout_percent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          application_id?: string | null
          assigned_payout_percent?: number | null
          created_at?: string
          email: string
          full_name: string
          last_assigned_at?: string | null
          payout_percent?: number | null
          referral_code: string
          referral_payout_percent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          application_id?: string | null
          assigned_payout_percent?: number | null
          created_at?: string
          email?: string
          full_name?: string
          last_assigned_at?: string | null
          payout_percent?: number | null
          referral_code?: string
          referral_payout_percent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "agent_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_sends: {
        Row: {
          business_name: string | null
          completed_at: string | null
          created_at: string
          delivery_method: string
          destination: string
          expires_at: string
          failure_reason: string | null
          id: string
          lead_id: string | null
          owner_name: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          token_hash: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          business_name?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_method: string
          destination: string
          expires_at?: string
          failure_reason?: string | null
          id?: string
          lead_id?: string | null
          owner_name?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          token_hash: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          business_name?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_method?: string
          destination?: string
          expires_at?: string
          failure_reason?: string | null
          id?: string
          lead_id?: string | null
          owner_name?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          token_hash?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_blueprints: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          request_id: string
          sections: Json
          status: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          request_id: string
          sections?: Json
          status?: string
          version: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          request_id?: string
          sections?: Json
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_blueprints_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "audit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_consents: {
        Row: {
          checked: boolean
          consent_type: string
          consented_at: string
          displayed_text: string
          form_version: string
          id: string
          ip: string | null
          page_url: string | null
          phone_entered: string | null
          request_id: string
        }
        Insert: {
          checked: boolean
          consent_type: string
          consented_at?: string
          displayed_text: string
          form_version: string
          id?: string
          ip?: string | null
          page_url?: string | null
          phone_entered?: string | null
          request_id: string
        }
        Update: {
          checked?: boolean
          consent_type?: string
          consented_at?: string
          displayed_text?: string
          form_version?: string
          id?: string
          ip?: string | null
          page_url?: string | null
          phone_entered?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_consents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "audit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          request_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "audit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_requests: {
        Row: {
          answers: Json
          business_name: string
          created_at: string
          email: string
          form_version: string
          full_name: string
          id: string
          landing_page: string | null
          payment_status: string
          phone: string | null
          phone_contact_allowed: boolean
          ref_code: string
          referrer: string | null
          retention_until: string | null
          status: Database["public"]["Enums"]["audit_status"]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          answers?: Json
          business_name: string
          created_at?: string
          email: string
          form_version: string
          full_name: string
          id?: string
          landing_page?: string | null
          payment_status?: string
          phone?: string | null
          phone_contact_allowed?: boolean
          ref_code: string
          referrer?: string | null
          retention_until?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          answers?: Json
          business_name?: string
          created_at?: string
          email?: string
          form_version?: string
          full_name?: string
          id?: string
          landing_page?: string | null
          payment_status?: string
          phone?: string | null
          phone_contact_allowed?: boolean
          ref_code?: string
          referrer?: string | null
          retention_until?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
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
      callback_requests: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          phone: string
          preferred_at: string | null
          preferred_datetime_raw: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone: string
          preferred_at?: string | null
          preferred_datetime_raw: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone?: string
          preferred_at?: string | null
          preferred_datetime_raw?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "callback_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      cash_gap_leads: {
        Row: {
          cash_gap: number
          created_at: string
          email: string
          id: string
          inputs: Json
          marketing_consent: boolean
          stage: string | null
        }
        Insert: {
          cash_gap: number
          created_at?: string
          email: string
          id?: string
          inputs?: Json
          marketing_consent?: boolean
          stage?: string | null
        }
        Update: {
          cash_gap?: number
          created_at?: string
          email?: string
          id?: string
          inputs?: Json
          marketing_consent?: boolean
          stage?: string | null
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
      crm_activities: {
        Row: {
          body: string | null
          created_at: string
          id: string
          lead_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          lead_id: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_jobs: {
        Row: {
          attempts: number
          claimed_at: string
          claimed_by: string
          created_at: string
          error: string | null
          expires_at: string
          finished_at: string | null
          id: string
          job_type: string
          lead_id: string
          result: Json | null
          status: string
          website_key: string | null
        }
        Insert: {
          attempts?: number
          claimed_at?: string
          claimed_by: string
          created_at?: string
          error?: string | null
          expires_at: string
          finished_at?: string | null
          id?: string
          job_type: string
          lead_id: string
          result?: Json | null
          status?: string
          website_key?: string | null
        }
        Update: {
          attempts?: number
          claimed_at?: string
          claimed_by?: string
          created_at?: string
          error?: string | null
          expires_at?: string
          finished_at?: string | null
          id?: string
          job_type?: string
          lead_id?: string
          result?: Json | null
          status?: string
          website_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_rejects: {
        Row: {
          created_at: string
          dismissed_at: string | null
          dismissed_by: string | null
          existing_lead_id: string | null
          found_by: string
          id: string
          payload: Json
          reason: string
          source_id: string | null
        }
        Insert: {
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          existing_lead_id?: string | null
          found_by: string
          id?: string
          payload: Json
          reason: string
          source_id?: string | null
        }
        Update: {
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          existing_lead_id?: string | null
          found_by?: string
          id?: string
          payload?: Json
          reason?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_rejects_existing_lead_id_fkey"
            columns: ["existing_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_rejects_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crm_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          agency: string | null
          agent_id: string | null
          assigned_to: string | null
          award_amount: number | null
          award_date: string | null
          city: string | null
          clearfund_commission: number | null
          company_key: string | null
          contact_name: string | null
          created_at: string
          dnc_at: string | null
          dnc_reason: string | null
          do_not_contact: boolean
          email: string | null
          email_source: string | null
          firm: string | null
          first_line: string | null
          found_at: string | null
          found_by: string | null
          id: string
          lead_ref: string | null
          lead_type: string | null
          need_score: number | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          qualifier: Json | null
          route_next: string | null
          route_override_by: string | null
          route_reasons: Json | null
          routed_at: string | null
          routed_product_id: string | null
          sector: string | null
          source: string
          source_id: string | null
          source_url: string | null
          stage: string
          state: string | null
          submitted_to_funder_at: string | null
          submitted_to_funder_by: string | null
          updated_at: string
          warm_reason: string | null
          website: string | null
          website_key: string | null
        }
        Insert: {
          agency?: string | null
          agent_id?: string | null
          assigned_to?: string | null
          award_amount?: number | null
          award_date?: string | null
          city?: string | null
          clearfund_commission?: number | null
          company_key?: string | null
          contact_name?: string | null
          created_at?: string
          dnc_at?: string | null
          dnc_reason?: string | null
          do_not_contact?: boolean
          email?: string | null
          email_source?: string | null
          firm?: string | null
          first_line?: string | null
          found_at?: string | null
          found_by?: string | null
          id?: string
          lead_ref?: string | null
          lead_type?: string | null
          need_score?: number | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          qualifier?: Json | null
          route_next?: string | null
          route_override_by?: string | null
          route_reasons?: Json | null
          routed_at?: string | null
          routed_product_id?: string | null
          sector?: string | null
          source?: string
          source_id?: string | null
          source_url?: string | null
          stage?: string
          state?: string | null
          submitted_to_funder_at?: string | null
          submitted_to_funder_by?: string | null
          updated_at?: string
          warm_reason?: string | null
          website?: string | null
          website_key?: string | null
        }
        Update: {
          agency?: string | null
          agent_id?: string | null
          assigned_to?: string | null
          award_amount?: number | null
          award_date?: string | null
          city?: string | null
          clearfund_commission?: number | null
          company_key?: string | null
          contact_name?: string | null
          created_at?: string
          dnc_at?: string | null
          dnc_reason?: string | null
          do_not_contact?: boolean
          email?: string | null
          email_source?: string | null
          firm?: string | null
          first_line?: string | null
          found_at?: string | null
          found_by?: string | null
          id?: string
          lead_ref?: string | null
          lead_type?: string | null
          need_score?: number | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          qualifier?: Json | null
          route_next?: string | null
          route_override_by?: string | null
          route_reasons?: Json | null
          routed_at?: string | null
          routed_product_id?: string | null
          sector?: string | null
          source?: string
          source_id?: string | null
          source_url?: string | null
          stage?: string
          state?: string | null
          submitted_to_funder_at?: string | null
          submitted_to_funder_by?: string | null
          updated_at?: string
          warm_reason?: string | null
          website?: string | null
          website_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_routed_product_id_fkey"
            columns: ["routed_product_id"]
            isOneToOne: false
            referencedRelation: "funder_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crm_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sources: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          last_run_at: string | null
          leads_found: number
          new_leads: number
          notes: string | null
          params: Json
          refresh_days: number
          slice_key: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_run_at?: string | null
          leads_found?: number
          new_leads?: number
          notes?: string | null
          params?: Json
          refresh_days?: number
          slice_key: string
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_run_at?: string | null
          leads_found?: number
          new_leads?: number
          notes?: string | null
          params?: Json
          refresh_days?: number
          slice_key?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_worker_calls: {
        Row: {
          created_at: string
          endpoint: string
          id: number
          worker: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: number
          worker: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: number
          worker?: string
        }
        Relationships: []
      }
      cta_clicks: {
        Row: {
          agent_id: string | null
          clicked_at: string
          cta: string
          destination: string
          id: string
          lead_id: string | null
          page: string | null
        }
        Insert: {
          agent_id?: string | null
          clicked_at?: string
          cta: string
          destination: string
          id?: string
          lead_id?: string | null
          page?: string | null
        }
        Update: {
          agent_id?: string | null
          clicked_at?: string
          cta?: string
          destination?: string
          id?: string
          lead_id?: string | null
          page?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cta_clicks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign: string | null
          created_at: string
          event: string
          id: string
          lead_id: string | null
          occurred_at: string
          provider: string
          provider_event_id: string | null
          recipient_email: string | null
          snippet: string | null
          step: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          event: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          provider?: string
          provider_event_id?: string | null
          recipient_email?: string | null
          snippet?: string | null
          step?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          event?: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          provider?: string
          provider_event_id?: string | null
          recipient_email?: string | null
          snippet?: string | null
          step?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      free_audit_consents: {
        Row: {
          audit_id: string
          checked: boolean
          consent_type: string
          consented_at: string
          displayed_text: string
          form_version: string
          id: string
          ip: string | null
          page_url: string | null
          phone_entered: string | null
        }
        Insert: {
          audit_id: string
          checked: boolean
          consent_type: string
          consented_at?: string
          displayed_text: string
          form_version: string
          id?: string
          ip?: string | null
          page_url?: string | null
          phone_entered?: string | null
        }
        Update: {
          audit_id?: string
          checked?: boolean
          consent_type?: string
          consented_at?: string
          displayed_text?: string
          form_version?: string
          id?: string
          ip?: string | null
          page_url?: string | null
          phone_entered?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "free_audit_consents_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "free_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      free_audit_events: {
        Row: {
          audit_id: string
          event_name: string
          id: string
          metadata: Json
          occurred_at: string
          step_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          audit_id: string
          event_name: string
          id?: string
          metadata?: Json
          occurred_at?: string
          step_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          audit_id?: string
          event_name?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          step_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "free_audit_events_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "free_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      free_audits: {
        Row: {
          ai_analysis: Json | null
          ai_raw: string | null
          ai_status: string
          answers: Json
          business_name: string
          created_at: string
          email: string
          first_name: string
          form_version: string
          id: string
          landing_page: string | null
          phone: string | null
          phone_contact_allowed: boolean
          referrer: string | null
          results: Json
          share_token: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_raw?: string | null
          ai_status?: string
          answers: Json
          business_name: string
          created_at?: string
          email: string
          first_name: string
          form_version: string
          id?: string
          landing_page?: string | null
          phone?: string | null
          phone_contact_allowed?: boolean
          referrer?: string | null
          results: Json
          share_token: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_raw?: string | null
          ai_status?: string
          answers?: Json
          business_name?: string
          created_at?: string
          email?: string
          first_name?: string
          form_version?: string
          id?: string
          landing_page?: string | null
          phone?: string | null
          phone_contact_allowed?: boolean
          referrer?: string | null
          results?: Json
          share_token?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      funder_products: {
        Row: {
          active: boolean
          amount_max: number | null
          amount_min: number | null
          apply_method: string
          apply_url: string | null
          commission_note: string | null
          commission_rank: number | null
          created_at: string
          excluded_states: string[]
          funder: string
          id: string
          max_monthly_revenue: number | null
          min_annual_sales: number | null
          min_credit_score: number | null
          min_monthly_revenue: number | null
          min_months: number | null
          needs_business_checking: boolean
          product: string
          product_kind: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_max?: number | null
          amount_min?: number | null
          apply_method?: string
          apply_url?: string | null
          commission_note?: string | null
          commission_rank?: number | null
          created_at?: string
          excluded_states?: string[]
          funder: string
          id?: string
          max_monthly_revenue?: number | null
          min_annual_sales?: number | null
          min_credit_score?: number | null
          min_monthly_revenue?: number | null
          min_months?: number | null
          needs_business_checking?: boolean
          product: string
          product_kind?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_max?: number | null
          amount_min?: number | null
          apply_method?: string
          apply_url?: string | null
          commission_note?: string | null
          commission_rank?: number | null
          created_at?: string
          excluded_states?: string[]
          funder?: string
          id?: string
          max_monthly_revenue?: number | null
          min_annual_sales?: number | null
          min_credit_score?: number | null
          min_monthly_revenue?: number | null
          min_months?: number | null
          needs_business_checking?: boolean
          product?: string
          product_kind?: string
          updated_at?: string
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
          email: string | null
          entry_cta: string | null
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
          service_interest: Database["public"]["Enums"]["service_interest"]
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
          email?: string | null
          entry_cta?: string | null
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
          service_interest?: Database["public"]["Enums"]["service_interest"]
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
          email?: string | null
          entry_cta?: string | null
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
          service_interest?: Database["public"]["Enums"]["service_interest"]
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
      outreach_visits: {
        Row: {
          agency: string | null
          crm_lead_id: string | null
          firm: string | null
          id: string
          ip_hash: string | null
          lead: string | null
          visited_at: string
        }
        Insert: {
          agency?: string | null
          crm_lead_id?: string | null
          firm?: string | null
          id?: string
          ip_hash?: string | null
          lead?: string | null
          visited_at?: string
        }
        Update: {
          agency?: string | null
          crm_lead_id?: string | null
          firm?: string | null
          id?: string
          ip_hash?: string | null
          lead?: string | null
          visited_at?: string
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
      recruits: {
        Row: {
          commission_experience: string
          commission_only_ok: boolean
          created_at: string
          current_work: string
          email: string
          full_name: string
          hard_stop_reason: string | null
          hours_per_week: string
          id: string
          notes: string | null
          outside_work_limit: string
          over_18: boolean
          owner_contact: string
          owner_network: string
          phone: string | null
          score: number
          source: string
          state: string
          status: string
          written_answer: string
        }
        Insert: {
          commission_experience: string
          commission_only_ok: boolean
          created_at?: string
          current_work: string
          email: string
          full_name: string
          hard_stop_reason?: string | null
          hours_per_week: string
          id?: string
          notes?: string | null
          outside_work_limit: string
          over_18: boolean
          owner_contact: string
          owner_network: string
          phone?: string | null
          score?: number
          source: string
          state: string
          status?: string
          written_answer: string
        }
        Update: {
          commission_experience?: string
          commission_only_ok?: boolean
          created_at?: string
          current_work?: string
          email?: string
          full_name?: string
          hard_stop_reason?: string | null
          hours_per_week?: string
          id?: string
          notes?: string | null
          outside_work_limit?: string
          over_18?: boolean
          owner_contact?: string
          owner_network?: string
          phone?: string | null
          score?: number
          source?: string
          state?: string
          status?: string
          written_answer?: string
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
      agent_approve_application: {
        Args: { _application_id: string; _reviewer: string; _user_id: string }
        Returns: string
      }
      agent_eligible: {
        Args: { _require_training: boolean; _user_id: string }
        Returns: boolean
      }
      agent_list_leads: {
        Args: never
        Returns: {
          contact_name: string
          firm: string
          id: string
          next_follow_up: string
          notes: string
          stage: string
          warm_reason: string
        }[]
      }
      agent_mark_training: { Args: { _section: string }; Returns: undefined }
      agent_record_agreement: {
        Args: { _ip: string; _user_id: string; _version: string }
        Returns: undefined
      }
      agent_reject_application: {
        Args: { _application_id: string }
        Returns: undefined
      }
      agent_submit_application: {
        Args: { _application: Json; _passed: boolean; _quiz_score: number }
        Returns: Json
      }
      agent_update_lead: {
        Args: { _lead_id: string; _note?: string; _stage?: string }
        Returns: undefined
      }
      crm_admin_add_source: {
        Args: { _params: Json; _refresh_days: number; _source: string }
        Returns: Json
      }
      crm_admin_assign_agent: {
        Args: { _agent_id: string; _lead_id: string }
        Returns: undefined
      }
      crm_admin_dismiss_reject: { Args: { _id: string }; Returns: undefined }
      crm_admin_mark_payout_paid: {
        Args: { _paid: boolean; _payout_id: string }
        Returns: undefined
      }
      crm_admin_release: {
        Args: { _id: string; _kind: string }
        Returns: undefined
      }
      crm_admin_save_agent_settings: {
        Args: { _auto_assign: boolean; _percent: number }
        Returns: undefined
      }
      crm_admin_save_agent_settings_v2: {
        Args: {
          _assigned_percent: number
          _auto_assign: boolean
          _referral_percent: number
        }
        Returns: undefined
      }
      crm_admin_set_source_status: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
      crm_agent_leaderboard: {
        Args: never
        Returns: {
          agent_id: string
          email: string
          full_name: string
          funded_deals: number
          paid_total: number
          payout_percent: number
          pending_total: number
          referral_code: string
          warm_leads: number
        }[]
      }
      crm_agent_leaderboard_v2: {
        Args: never
        Returns: {
          agent_id: string
          assigned_payout_percent: number
          email: string
          full_name: string
          funded_deals: number
          paid_total: number
          pending_total: number
          referral_code: string
          referral_payout_percent: number
          warm_leads: number
        }[]
      }
      crm_auto_assign_lead: { Args: { _lead_id: string }; Returns: undefined }
      crm_cap_json: { Args: { _j: Json; _max: number }; Returns: Json }
      crm_claim_jobs: {
        Args: { _n: number; _type: string; _worker: string }
        Returns: Json
      }
      crm_claim_source: {
        Args: { _source: string; _worker: string }
        Returns: Json
      }
      crm_complete_job: {
        Args: {
          _error: string
          _job_id: string
          _ok: boolean
          _result: Json
          _worker: string
        }
        Returns: string
      }
      crm_complete_source: {
        Args: {
          _leads: Json
          _note: string
          _slice_id: string
          _status: string
          _worker: string
        }
        Returns: Json
      }
      crm_compute_warm_reason: {
        Args: { _lead: Database["public"]["Tables"]["crm_leads"]["Row"] }
        Returns: string
      }
      crm_find_leads: {
        Args: {
          _email: string
          _firm: string
          _limit: number
          _type?: string
          _worker: string
        }
        Returns: Json
      }
      crm_import_leads: { Args: { _mode?: string; _rows: Json }; Returns: Json }
      crm_import_recruits: { Args: { _rows: Json }; Returns: Json }
      crm_insert_lead: {
        Args: {
          _found_by: string
          _lead: Json
          _mode?: string
          _source_id: string
        }
        Returns: Json
      }
      crm_job_ttl: { Args: { _type: string }; Returns: string }
      crm_lead_counts: {
        Args: {
          _agent?: string
          _due?: string
          _q?: string
          _source?: string
          _today: string
          _type?: string
        }
        Returns: Json
      }
      crm_lead_counts_v2: {
        Args: {
          _agent?: string
          _due?: string
          _q?: string
          _source?: string
          _today: string
          _type?: string
          _warm?: boolean
        }
        Returns: Json
      }
      crm_lead_eligible: {
        Args: {
          _l: Database["public"]["Tables"]["crm_leads"]["Row"]
          _type: string
        }
        Returns: boolean
      }
      crm_list_agents: {
        Args: never
        Returns: {
          email: string
          id: string
          role: string
        }[]
      }
      crm_mark_contacted: {
        Args: { _job_id: string; _lead_id: string; _worker: string }
        Returns: string
      }
      crm_mark_submitted_to_funder: {
        Args: { _lead_id: string }
        Returns: undefined
      }
      crm_norm_company: { Args: { _t: string }; Returns: string }
      crm_norm_domain: { Args: { _t: string }; Returns: string }
      crm_preview_recruit_import: { Args: { _rows: Json }; Returns: Json }
      crm_register_source: {
        Args: {
          _params: Json
          _refresh_days: number
          _source: string
          _worker: string
        }
        Returns: Json
      }
      crm_set_route: {
        Args: { _lead_id: string; _product_id: string }
        Returns: undefined
      }
      crm_source_key: {
        Args: { _params: Json; _source: string }
        Returns: string
      }
      crm_stage_ok: {
        Args: { _lead_type: string; _stage: string }
        Returns: boolean
      }
      crm_worker_hit: {
        Args: { _endpoint: string; _worker: string }
        Returns: boolean
      }
      crm_worker_log_reply: {
        Args: {
          _from_email: string
          _inbox: string
          _label: string
          _lead_id: string
          _received_at: string
          _snippet: string
          _subject: string
          _worker: string
        }
        Returns: Json
      }
      crm_worker_mark_dnc: {
        Args: { _lead_id: string; _reason: string; _worker: string }
        Returns: string
      }
      crm_worker_stats: { Args: never; Returns: Json }
      crm_worker_update_lead: {
        Args: {
          _lead_id: string
          _next_follow_up: string
          _note: string
          _set_follow_up: boolean
          _stage: string
          _worker: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ingest_email_event: {
        Args: {
          _campaign: string
          _email: string
          _event: string
          _lead_id: string
          _lead_ref: string
          _message_id: string
          _occurred_at: string
          _provider: string
          _snippet: string
          _step: string
        }
        Returns: string
      }
      is_crm_user: { Args: { _user_id: string }; Returns: boolean }
      is_operator: { Args: { _user_id: string }; Returns: boolean }
      log_cta_click: {
        Args: {
          _agent_code?: string
          _cta: string
          _destination: string
          _lead_id?: string
          _page: string
        }
        Returns: string
      }
      log_outreach_visit: {
        Args: { _agency: string; _firm: string; _lead: string }
        Returns: string
      }
      operator_save_blueprint: {
        Args: { _approve: boolean; _request_id: string; _sections: Json }
        Returns: number
      }
      operator_set_audit_status: {
        Args: {
          _note: string
          _request_id: string
          _status: Database["public"]["Enums"]["audit_status"]
        }
        Returns: undefined
      }
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
          email: string | null
          entry_cta: string | null
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
          service_interest: Database["public"]["Enums"]["service_interest"]
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
      track_agent_referral: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "operator" | "agent"
      application_status: "not_started" | "in_progress" | "completed"
      audit_status:
        | "submitted"
        | "in_review"
        | "blueprint_draft"
        | "owner_approved"
        | "delivered"
        | "cancelled"
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
      service_interest:
        | "working_capital"
        | "gig_funding"
        | "insurance_restoration"
        | "other"
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
      app_role: ["admin", "operator", "agent"],
      application_status: ["not_started", "in_progress", "completed"],
      audit_status: [
        "submitted",
        "in_review",
        "blueprint_draft",
        "owner_approved",
        "delivered",
        "cancelled",
      ],
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
      service_interest: [
        "working_capital",
        "gig_funding",
        "insurance_restoration",
        "other",
      ],
    },
  },
} as const
