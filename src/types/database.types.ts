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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_platform_role:
            | Database["public"]["Enums"]["platform_role"]
            | null
          actor_user_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_platform_role?:
            | Database["public"]["Enums"]["platform_role"]
            | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_platform_role?:
            | Database["public"]["Enums"]["platform_role"]
            | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          responded_at: string | null
          responded_by: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          auto_renew: boolean | null
          checked_at: string | null
          created_at: string
          dns_status: Database["public"]["Enums"]["dns_status"]
          domain: string
          expires_at: string | null
          id: string
          is_primary: boolean
          nameservers: string[] | null
          organization_id: string
          registrar: string | null
          ssl_status: Database["public"]["Enums"]["ssl_status"]
          status: Database["public"]["Enums"]["domain_status"]
          updated_at: string
          verification_source: Database["public"]["Enums"]["verification_source"]
          website_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          checked_at?: string | null
          created_at?: string
          dns_status?: Database["public"]["Enums"]["dns_status"]
          domain: string
          expires_at?: string | null
          id?: string
          is_primary?: boolean
          nameservers?: string[] | null
          organization_id: string
          registrar?: string | null
          ssl_status?: Database["public"]["Enums"]["ssl_status"]
          status?: Database["public"]["Enums"]["domain_status"]
          updated_at?: string
          verification_source?: Database["public"]["Enums"]["verification_source"]
          website_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          checked_at?: string | null
          created_at?: string
          dns_status?: Database["public"]["Enums"]["dns_status"]
          domain?: string
          expires_at?: string | null
          id?: string
          is_primary?: boolean
          nameservers?: string[] | null
          organization_id?: string
          registrar?: string | null
          ssl_status?: Database["public"]["Enums"]["ssl_status"]
          status?: Database["public"]["Enums"]["domain_status"]
          updated_at?: string
          verification_source?: Database["public"]["Enums"]["verification_source"]
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due_cents: number
          amount_paid_cents: number
          amount_remaining_cents: number | null
          created_at: string
          currency: string
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_pdf_url: string | null
          number: string | null
          organization_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_created_at: string | null
          stripe_customer_id: string | null
          stripe_event_at: string | null
          stripe_invoice_id: string
          subscription_id: string | null
          subtotal_cents: number | null
          synced_at: string
          tax_cents: number | null
          total_cents: number | null
          updated_at: string
        }
        Insert: {
          amount_due_cents?: number
          amount_paid_cents?: number
          amount_remaining_cents?: number | null
          created_at?: string
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf_url?: string | null
          number?: string | null
          organization_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_created_at?: string | null
          stripe_customer_id?: string | null
          stripe_event_at?: string | null
          stripe_invoice_id: string
          subscription_id?: string | null
          subtotal_cents?: number | null
          synced_at?: string
          tax_cents?: number | null
          total_cents?: number | null
          updated_at?: string
        }
        Update: {
          amount_due_cents?: number
          amount_paid_cents?: number
          amount_remaining_cents?: number | null
          created_at?: string
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf_url?: string | null
          number?: string | null
          organization_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_created_at?: string | null
          stripe_customer_id?: string | null
          stripe_event_at?: string | null
          stripe_invoice_id?: string
          subscription_id?: string | null
          subtotal_cents?: number | null
          synced_at?: string
          tax_cents?: number | null
          total_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          failure_reason: string | null
          group_key: string | null
          id: string
          organization_id: string | null
          read_at: string | null
          resource_id: string | null
          resource_type: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          failure_reason?: string | null
          group_key?: string | null
          id?: string
          organization_id?: string | null
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          failure_reason?: string | null
          group_key?: string | null
          id?: string
          organization_id?: string | null
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          billing_email: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          siret: string | null
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          stripe_customer_id: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          billing_email?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          stripe_customer_id?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          billing_email?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          stripe_customer_id?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          card_brand: string | null
          card_last4: string | null
          created_at: string
          currency: string
          failure_code: string | null
          failure_message: string | null
          id: string
          invoice_id: string | null
          organization_id: string
          paid_at: string | null
          payment_method_type: string | null
          refunded_amount_cents: number
          status: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id: string | null
          stripe_created_at: string | null
          stripe_event_at: string | null
          stripe_payment_intent_id: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          invoice_id?: string | null
          organization_id: string
          paid_at?: string | null
          payment_method_type?: string | null
          refunded_amount_cents?: number
          status: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_created_at?: string | null
          stripe_event_at?: string | null
          stripe_payment_intent_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          invoice_id?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_method_type?: string | null
          refunded_amount_cents?: number
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_created_at?: string | null
          stripe_event_at?: string | null
          stripe_payment_intent_id?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          is_included: boolean
          label: string
          plan_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          is_included?: boolean
          label: string
          plan_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          is_included?: boolean
          label?: string
          plan_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_prices: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          is_starting_price: boolean
          kind: Database["public"]["Enums"]["price_kind"]
          plan_id: string
          recurring_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          stripe_price_id: string | null
          unit_amount_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_starting_price?: boolean
          kind: Database["public"]["Enums"]["price_kind"]
          plan_id: string
          recurring_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          stripe_price_id?: string | null
          unit_amount_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_starting_price?: boolean
          kind?: Database["public"]["Enums"]["price_kind"]
          plan_id?: string
          recurring_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          stripe_price_id?: string | null
          unit_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_prices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_public: boolean
          name: string
          requires_quote: boolean
          sort_order: number
          stripe_product_id: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_public?: boolean
          name: string
          requires_quote?: boolean
          sort_order?: number
          stripe_product_id?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_public?: boolean
          name?: string
          requires_quote?: boolean
          sort_order?: number
          stripe_product_id?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          platform_role: Database["public"]["Enums"]["platform_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          assigned_to: string | null
          budget_range: string | null
          company_name: string | null
          converted_organization_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          internal_notes: string | null
          message: string
          phone: string | null
          plan_id: string | null
          project_type: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget_range?: string | null
          company_name?: string | null
          converted_organization_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          internal_notes?: string | null
          message: string
          phone?: string | null
          plan_id?: string | null
          project_type?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget_range?: string | null
          company_name?: string | null
          converted_organization_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          internal_notes?: string | null
          message?: string
          phone?: string | null
          plan_id?: string | null
          project_type?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_converted_organization_id_fkey"
            columns: ["converted_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          api_version: string | null
          attempts: number
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          livemode: boolean
          organization_id: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
          stripe_created_at: string | null
          stripe_object_id: string | null
          updated_at: string
        }
        Insert: {
          api_version?: string | null
          attempts?: number
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          livemode?: boolean
          organization_id?: string | null
          payload: Json
          processed?: boolean
          processed_at?: string | null
          stripe_created_at?: string | null
          stripe_object_id?: string | null
          updated_at?: string
        }
        Update: {
          api_version?: string | null
          attempts?: number
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          livemode?: boolean
          organization_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          stripe_created_at?: string | null
          stripe_object_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          mrr_cents: number | null
          organization_id: string
          plan_id: string | null
          quantity: number
          recurring_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_event_at: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string
          synced_at: string
          trial_end: string | null
          trial_start: string | null
          unit_amount_cents: number | null
          updated_at: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          mrr_cents?: number | null
          organization_id: string
          plan_id?: string | null
          quantity?: number
          recurring_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          started_at?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          stripe_event_at?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id: string
          synced_at?: string
          trial_end?: string | null
          trial_start?: string | null
          unit_amount_cents?: number | null
          updated_at?: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          mrr_cents?: number | null
          organization_id?: string
          plan_id?: string | null
          quantity?: number
          recurring_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          stripe_event_at?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string
          synced_at?: string
          trial_end?: string | null
          trial_start?: string | null
          unit_amount_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string | null
          author_is_staff: boolean
          body: string
          created_at: string
          id: string
          is_internal_note: boolean
          ticket_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_is_staff?: boolean
          body: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          ticket_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_is_staff?: boolean
          body?: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          first_response_at: string | null
          id: string
          last_activity_at: string
          organization_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          reference: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string
          website_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          first_response_at?: string | null
          id?: string
          last_activity_at?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reference?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
          website_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          first_response_at?: string | null
          id?: string
          last_activity_at?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reference?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          message_id: string | null
          mime_type: string
          organization_id: string
          size_bytes: number
          storage_path: string
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          message_id?: string | null
          mime_type: string
          organization_id: string
          size_bytes: number
          storage_path: string
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          message_id?: string | null
          mime_type?: string
          organization_id?: string
          size_bytes?: number
          storage_path?: string
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          checked_at: string | null
          created_at: string
          environment: Database["public"]["Enums"]["deploy_environment"]
          hosting_provider: string
          id: string
          last_deployed_at: string | null
          last_deployment_id: string | null
          name: string
          organization_id: string
          production_url: string | null
          repository_url: string | null
          slug: string
          ssl_status: Database["public"]["Enums"]["ssl_status"]
          status: Database["public"]["Enums"]["website_status"]
          updated_at: string
          uptime_percentage: number | null
          uptime_window_days: number | null
          vercel_project_id: string | null
          vercel_team_id: string | null
          verification_source: Database["public"]["Enums"]["verification_source"]
        }
        Insert: {
          checked_at?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["deploy_environment"]
          hosting_provider?: string
          id?: string
          last_deployed_at?: string | null
          last_deployment_id?: string | null
          name: string
          organization_id: string
          production_url?: string | null
          repository_url?: string | null
          slug: string
          ssl_status?: Database["public"]["Enums"]["ssl_status"]
          status?: Database["public"]["Enums"]["website_status"]
          updated_at?: string
          uptime_percentage?: number | null
          uptime_window_days?: number | null
          vercel_project_id?: string | null
          vercel_team_id?: string | null
          verification_source?: Database["public"]["Enums"]["verification_source"]
        }
        Update: {
          checked_at?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["deploy_environment"]
          hosting_provider?: string
          id?: string
          last_deployed_at?: string | null
          last_deployment_id?: string | null
          name?: string
          organization_id?: string
          production_url?: string | null
          repository_url?: string | null
          slug?: string
          ssl_status?: Database["public"]["Enums"]["ssl_status"]
          status?: Database["public"]["Enums"]["website_status"]
          updated_at?: string
          uptime_percentage?: number | null
          uptime_window_days?: number | null
          vercel_project_id?: string | null
          vercel_team_id?: string | null
          verification_source?: Database["public"]["Enums"]["verification_source"]
        }
        Relationships: [
          {
            foreignKeyName: "websites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_ticket: { Args: { p_ticket_id: string }; Returns: boolean }
      create_organization: {
        Args: { p_name: string; p_slug: string }
        Returns: string
      }
      current_org_ids: { Args: never; Returns: string[] }
      current_platform_role: {
        Args: never
        Returns: Database["public"]["Enums"]["platform_role"]
      }
      is_org_manager: { Args: { p_organization_id: string }; Returns: boolean }
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean }
      is_org_owner: { Args: { p_organization_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_platform_owner: { Args: never; Returns: boolean }
      is_platform_staff: { Args: never; Returns: boolean }
      is_trusted_backend: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_organization_id?: string
          p_resource_id?: string
          p_resource_type?: string
        }
        Returns: string
      }
      safe_uuid: { Args: { p_value: string }; Returns: string }
      shares_organization_with: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      ticket_organization_id: { Args: { p_ticket_id: string }; Returns: string }
    }
    Enums: {
      billing_interval: "day" | "week" | "month" | "year"
      deploy_environment: "DEVELOPMENT" | "PREVIEW" | "PRODUCTION"
      dns_status:
        | "UNKNOWN"
        | "PENDING"
        | "CONFIGURED"
        | "MISCONFIGURED"
        | "ERROR"
      domain_status:
        | "UNKNOWN"
        | "PENDING"
        | "ACTIVE"
        | "EXPIRING"
        | "EXPIRED"
        | "TRANSFERRING"
        | "ERROR"
      invoice_status: "draft" | "open" | "paid" | "uncollectible" | "void"
      lead_status:
        | "NEW"
        | "CONTACTED"
        | "QUALIFIED"
        | "CONVERTED"
        | "REJECTED"
        | "SPAM"
      membership_status: "INVITED" | "ACTIVE" | "REVOKED"
      notification_channel: "IN_APP" | "EMAIL"
      notification_status: "PENDING" | "SENT" | "FAILED"
      org_role: "OWNER" | "MANAGER" | "MEMBER"
      organization_status: "ACTIVE" | "SUSPENDED" | "ARCHIVED"
      payment_status:
        | "requires_payment_method"
        | "requires_action"
        | "processing"
        | "succeeded"
        | "failed"
        | "canceled"
        | "refunded"
        | "partially_refunded"
      platform_role: "OWNER" | "ADMIN" | "STAFF" | "SUPPORT"
      price_kind: "RECURRING" | "ONE_TIME"
      ssl_status:
        | "UNKNOWN"
        | "PENDING"
        | "ACTIVE"
        | "EXPIRING"
        | "EXPIRED"
        | "ERROR"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      ticket_category:
        | "SITE"
        | "DOMAINE"
        | "HEBERGEMENT"
        | "FACTURATION"
        | "SUPPORT"
        | "AUTRE"
      ticket_priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      ticket_status:
        | "OPEN"
        | "IN_PROGRESS"
        | "WAITING_CLIENT"
        | "RESOLVED"
        | "CLOSED"
      ticket_type: "SUPPORT" | "CHANGE_REQUEST"
      verification_source: "NONE" | "MANUAL" | "VERCEL_API" | "CLOUDFLARE_API"
      website_status:
        | "DRAFT"
        | "IN_DEVELOPMENT"
        | "STAGING"
        | "ONLINE"
        | "SUSPENDED"
        | "ARCHIVED"
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
      billing_interval: ["day", "week", "month", "year"],
      deploy_environment: ["DEVELOPMENT", "PREVIEW", "PRODUCTION"],
      dns_status: [
        "UNKNOWN",
        "PENDING",
        "CONFIGURED",
        "MISCONFIGURED",
        "ERROR",
      ],
      domain_status: [
        "UNKNOWN",
        "PENDING",
        "ACTIVE",
        "EXPIRING",
        "EXPIRED",
        "TRANSFERRING",
        "ERROR",
      ],
      invoice_status: ["draft", "open", "paid", "uncollectible", "void"],
      lead_status: [
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "CONVERTED",
        "REJECTED",
        "SPAM",
      ],
      membership_status: ["INVITED", "ACTIVE", "REVOKED"],
      notification_channel: ["IN_APP", "EMAIL"],
      notification_status: ["PENDING", "SENT", "FAILED"],
      org_role: ["OWNER", "MANAGER", "MEMBER"],
      organization_status: ["ACTIVE", "SUSPENDED", "ARCHIVED"],
      payment_status: [
        "requires_payment_method",
        "requires_action",
        "processing",
        "succeeded",
        "failed",
        "canceled",
        "refunded",
        "partially_refunded",
      ],
      platform_role: ["OWNER", "ADMIN", "STAFF", "SUPPORT"],
      price_kind: ["RECURRING", "ONE_TIME"],
      ssl_status: [
        "UNKNOWN",
        "PENDING",
        "ACTIVE",
        "EXPIRING",
        "EXPIRED",
        "ERROR",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
      ticket_category: [
        "SITE",
        "DOMAINE",
        "HEBERGEMENT",
        "FACTURATION",
        "SUPPORT",
        "AUTRE",
      ],
      ticket_priority: ["LOW", "NORMAL", "HIGH", "URGENT"],
      ticket_status: [
        "OPEN",
        "IN_PROGRESS",
        "WAITING_CLIENT",
        "RESOLVED",
        "CLOSED",
      ],
      ticket_type: ["SUPPORT", "CHANGE_REQUEST"],
      verification_source: ["NONE", "MANUAL", "VERCEL_API", "CLOUDFLARE_API"],
      website_status: [
        "DRAFT",
        "IN_DEVELOPMENT",
        "STAGING",
        "ONLINE",
        "SUSPENDED",
        "ARCHIVED",
      ],
    },
  },
} as const
