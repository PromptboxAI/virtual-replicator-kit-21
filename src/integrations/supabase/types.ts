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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_value: Json
          old_value: Json | null
          setting_key: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_value: Json
          old_value?: Json | null
          setting_key: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_value?: Json
          old_value?: Json | null
          setting_key?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      agent_activities: {
        Row: {
          activity_type: string
          agent_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          result: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          agent_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          result?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          agent_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          result?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_chart_init: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          initial_price: number | null
          initial_supply: number | null
          initialization_data: Json | null
          initialized: boolean
          token_address: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          initial_price?: number | null
          initial_supply?: number | null
          initialization_data?: Json | null
          initialized?: boolean
          token_address: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          initial_price?: number | null
          initial_supply?: number | null
          initialization_data?: Json | null
          initialized?: boolean
          token_address?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_chart_init_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_chart_init_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_chart_init_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_chart_init_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_chart_init_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_configurations: {
        Row: {
          agent_id: string
          category: string
          configuration: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          category: string
          configuration?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          category?: string
          configuration?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_database_positions: {
        Row: {
          agent_id: string
          holder_address: string
          id: string
          last_updated: string | null
          token_balance: number
        }
        Insert: {
          agent_id: string
          holder_address: string
          id?: string
          last_updated?: string | null
          token_balance?: number
        }
        Update: {
          agent_id?: string
          holder_address?: string
          id?: string
          last_updated?: string | null
          token_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_database_positions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_database_positions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_database_positions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_database_positions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_database_positions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_graduation: {
        Row: {
          agent_id: string
          policy_id: string | null
          reason: string | null
          snapshot: Json | null
          status: string
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          policy_id?: string | null
          reason?: string | null
          snapshot?: Json | null
          status: string
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          policy_id?: string | null
          reason?: string | null
          snapshot?: Json | null
          status?: string
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_graduation_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_graduation_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_graduation_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_graduation_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_graduation_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_graduation_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "graduation_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_graduation_events: {
        Row: {
          agent_id: string
          created_at: string
          deployment_tx_hash: string | null
          error_message: string | null
          graduation_status: string
          graduation_timestamp: string
          id: string
          liquidity_pool_address: string | null
          liquidity_tx_hash: string | null
          metadata: Json | null
          prompt_raised_at_graduation: number
          updated_at: string
          v2_contract_address: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          deployment_tx_hash?: string | null
          error_message?: string | null
          graduation_status?: string
          graduation_timestamp?: string
          id?: string
          liquidity_pool_address?: string | null
          liquidity_tx_hash?: string | null
          metadata?: Json | null
          prompt_raised_at_graduation: number
          updated_at?: string
          v2_contract_address?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          deployment_tx_hash?: string | null
          error_message?: string | null
          graduation_status?: string
          graduation_timestamp?: string
          id?: string
          liquidity_pool_address?: string | null
          liquidity_tx_hash?: string | null
          metadata?: Json | null
          prompt_raised_at_graduation?: number
          updated_at?: string
          v2_contract_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_graduation_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_graduation_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_graduation_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_graduation_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_graduation_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_graduation_events_backup: {
        Row: {
          agent_id: string | null
          created_at: string | null
          deployment_tx_hash: string | null
          error_message: string | null
          graduation_status: string | null
          graduation_timestamp: string | null
          id: string | null
          liquidity_pool_address: string | null
          liquidity_tx_hash: string | null
          metadata: Json | null
          prompt_raised_at_graduation: number | null
          updated_at: string | null
          v2_contract_address: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          deployment_tx_hash?: string | null
          error_message?: string | null
          graduation_status?: string | null
          graduation_timestamp?: string | null
          id?: string | null
          liquidity_pool_address?: string | null
          liquidity_tx_hash?: string | null
          metadata?: Json | null
          prompt_raised_at_graduation?: number | null
          updated_at?: string | null
          v2_contract_address?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          deployment_tx_hash?: string | null
          error_message?: string | null
          graduation_status?: string | null
          graduation_timestamp?: string | null
          id?: string | null
          liquidity_pool_address?: string | null
          liquidity_tx_hash?: string | null
          metadata?: Json | null
          prompt_raised_at_graduation?: number | null
          updated_at?: string | null
          v2_contract_address?: string | null
        }
        Relationships: []
      }
      agent_holder_rewards: {
        Row: {
          agent_id: string
          claimed_amount: number | null
          created_at: string | null
          holder_address: string
          id: string
          start_time: string
          total_reward_amount: number
          vest_end_time: string
        }
        Insert: {
          agent_id: string
          claimed_amount?: number | null
          created_at?: string | null
          holder_address: string
          id?: string
          start_time: string
          total_reward_amount: number
          vest_end_time: string
        }
        Update: {
          agent_id?: string
          claimed_amount?: number | null
          created_at?: string | null
          holder_address?: string
          id?: string
          start_time?: string
          total_reward_amount?: number
          vest_end_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_holder_rewards_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_holder_rewards_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_holder_rewards_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_holder_rewards_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_holder_rewards_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_interactions: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_logs: {
        Row: {
          agent_id: string
          context: Json | null
          created_at: string
          id: string
          log_level: string
          message: string
        }
        Insert: {
          agent_id: string
          context?: Json | null
          created_at?: string
          id?: string
          log_level?: string
          message: string
        }
        Update: {
          agent_id?: string
          context?: Json | null
          created_at?: string
          id?: string
          log_level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_lp_info: {
        Row: {
          agent_id: string
          created_at: string | null
          lock_id: number
          lp_locked: number
          lp_pair_address: string
          lp_to_vault: number
          total_lp_tokens: number
          unlock_time: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          lock_id: number
          lp_locked: number
          lp_pair_address: string
          lp_to_vault: number
          total_lp_tokens: number
          unlock_time: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          lock_id?: number
          lp_locked?: number
          lp_pair_address?: string
          lp_to_vault?: number
          total_lp_tokens?: number
          unlock_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_lp_info_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_lp_info_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_lp_info_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_lp_info_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_lp_info_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_marketing: {
        Row: {
          agent_id: string
          created_at: string
          demo_videos: Json | null
          description: string | null
          discord_url: string | null
          id: string
          screenshots: Json | null
          telegram_url: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
          whitepaper_content: string | null
          whitepaper_url: string | null
          youtube_url: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          demo_videos?: Json | null
          description?: string | null
          discord_url?: string | null
          id?: string
          screenshots?: Json | null
          telegram_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          whitepaper_content?: string | null
          whitepaper_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          demo_videos?: Json | null
          description?: string | null
          discord_url?: string | null
          id?: string
          screenshots?: Json | null
          telegram_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          whitepaper_content?: string | null
          whitepaper_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      agent_migration_state: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          migration_completed_at: string | null
          migration_phase: string
          migration_started_at: string | null
          new_price: number | null
          new_supply: number | null
          old_price: number | null
          old_supply: number | null
          rollback_data: Json | null
          updated_at: string
          validation_passed: boolean | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          migration_completed_at?: string | null
          migration_phase?: string
          migration_started_at?: string | null
          new_price?: number | null
          new_supply?: number | null
          old_price?: number | null
          old_supply?: number | null
          rollback_data?: Json | null
          updated_at?: string
          validation_passed?: boolean | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          migration_completed_at?: string | null
          migration_phase?: string
          migration_started_at?: string | null
          new_price?: number | null
          new_supply?: number | null
          old_price?: number | null
          old_supply?: number | null
          rollback_data?: Json | null
          updated_at?: string
          validation_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_migration_state_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_migration_state_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_migration_state_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_migration_state_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_migration_state_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ohlcv: {
        Row: {
          agent_id: string
          bucket_time: string
          close_prompt: number
          high_prompt: number
          low_prompt: number
          open_prompt: number
          timeframe: string
          volume_agent: number
        }
        Insert: {
          agent_id: string
          bucket_time: string
          close_prompt: number
          high_prompt: number
          low_prompt: number
          open_prompt: number
          timeframe: string
          volume_agent?: number
        }
        Update: {
          agent_id?: string
          bucket_time?: string
          close_prompt?: number
          high_prompt?: number
          low_prompt?: number
          open_prompt?: number
          timeframe?: string
          volume_agent?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_ohlcv_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_ohlcv_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_ohlcv_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_ohlcv_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_ohlcv_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_price_history: {
        Row: {
          agent_id: string
          id: string
          market_cap: number | null
          price: number
          timestamp: string
          volume: number | null
        }
        Insert: {
          agent_id: string
          id?: string
          market_cap?: number | null
          price: number
          timestamp?: string
          volume?: number | null
        }
        Update: {
          agent_id?: string
          id?: string
          market_cap?: number | null
          price?: number
          timestamp?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_price_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_price_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_price_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_price_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_price_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_price_snapshots: {
        Row: {
          agent_id: string
          circulating_supply: number | null
          holders_count: number | null
          id: string
          market_cap: number | null
          price: number
          prompt_raised: number | null
          timestamp: string | null
          volume_24h: number | null
        }
        Insert: {
          agent_id: string
          circulating_supply?: number | null
          holders_count?: number | null
          id?: string
          market_cap?: number | null
          price: number
          prompt_raised?: number | null
          timestamp?: string | null
          volume_24h?: number | null
        }
        Update: {
          agent_id?: string
          circulating_supply?: number | null
          holders_count?: number | null
          id?: string
          market_cap?: number | null
          price?: number
          prompt_raised?: number | null
          timestamp?: string | null
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_price_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_price_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_price_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_price_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_price_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_realtime_updates: {
        Row: {
          agent_id: string
          created_at: string
          event_data: Json
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_realtime_updates_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_realtime_updates_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_realtime_updates_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_realtime_updates_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_realtime_updates_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_roadmap_milestones: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_roadmap_milestones_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_roadmap_milestones_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_roadmap_milestones_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_roadmap_milestones_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_roadmap_milestones_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runtime_status: {
        Row: {
          agent_id: string
          created_at: string
          current_goal: string | null
          id: string
          is_active: boolean
          last_activity_at: string | null
          performance_metrics: Json | null
          revenue_generated: number | null
          tasks_completed: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          current_goal?: string | null
          id?: string
          is_active?: boolean
          last_activity_at?: string | null
          performance_metrics?: Json | null
          revenue_generated?: number | null
          tasks_completed?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          current_goal?: string | null
          id?: string
          is_active?: boolean
          last_activity_at?: string | null
          performance_metrics?: Json | null
          revenue_generated?: number | null
          tasks_completed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runtime_status_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_runtime_status_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runtime_status_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_runtime_status_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runtime_status_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_safety_settings: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          max_daily_trade_prompt: number
          max_single_trade_prompt: number
          max_user_daily_prompt: number
          trade_paused: boolean
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          max_daily_trade_prompt?: number
          max_single_trade_prompt?: number
          max_user_daily_prompt?: number
          trade_paused?: boolean
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          max_daily_trade_prompt?: number
          max_single_trade_prompt?: number
          max_user_daily_prompt?: number
          trade_paused?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_safety_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_safety_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_safety_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_safety_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_safety_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_team_members: {
        Row: {
          agent_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          linkedin_url: string | null
          name: string
          order_index: number | null
          role: string
          twitter_url: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          order_index?: number | null
          role: string
          twitter_url?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          order_index?: number | null
          role?: string
          twitter_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_team_vesting: {
        Row: {
          agent_id: string
          beneficiary_address: string
          claimed_amount: number | null
          cliff_1_time: string
          cliff_2_time: string
          created_at: string | null
          start_time: string
          total_amount: number
        }
        Insert: {
          agent_id: string
          beneficiary_address: string
          claimed_amount?: number | null
          cliff_1_time: string
          cliff_2_time: string
          created_at?: string | null
          start_time: string
          total_amount: number
        }
        Update: {
          agent_id?: string
          beneficiary_address?: string
          claimed_amount?: number | null
          cliff_1_time?: string
          cliff_2_time?: string
          created_at?: string | null
          start_time?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_team_vesting_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_team_vesting_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_team_vesting_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_team_vesting_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_team_vesting_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_token_buy_trades: {
        Row: {
          agent_id: string
          block_number: number | null
          bonding_curve_price: number
          created_at: string
          id: string
          price_per_token: number
          prompt_amount: number
          token_amount: number
          tokens_sold_before: number | null
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          block_number?: number | null
          bonding_curve_price: number
          created_at?: string
          id?: string
          price_per_token: number
          prompt_amount: number
          token_amount: number
          tokens_sold_before?: number | null
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          block_number?: number | null
          bonding_curve_price?: number
          created_at?: string
          id?: string
          price_per_token?: number
          prompt_amount?: number
          token_amount?: number
          tokens_sold_before?: number | null
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_token_holders: {
        Row: {
          agent_id: string
          average_buy_price: number | null
          created_at: string | null
          id: string
          realized_profit_loss: number | null
          token_balance: number
          total_invested: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          average_buy_price?: number | null
          created_at?: string | null
          id?: string
          realized_profit_loss?: number | null
          token_balance?: number
          total_invested?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          average_buy_price?: number | null
          created_at?: string | null
          id?: string
          realized_profit_loss?: number | null
          token_balance?: number
          total_invested?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_token_holders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_token_holders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_token_holders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_token_holders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_token_holders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_token_holders_backup: {
        Row: {
          agent_id: string | null
          average_buy_price: number | null
          created_at: string | null
          id: string | null
          realized_profit_loss: number | null
          token_balance: number | null
          total_invested: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          average_buy_price?: number | null
          created_at?: string | null
          id?: string | null
          realized_profit_loss?: number | null
          token_balance?: number | null
          total_invested?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          average_buy_price?: number | null
          created_at?: string | null
          id?: string | null
          realized_profit_loss?: number | null
          token_balance?: number | null
          total_invested?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_token_sell_trades: {
        Row: {
          agent_id: string
          block_number: number | null
          bonding_curve_price: number
          created_at: string
          id: string
          price_per_token: number
          prompt_amount: number
          token_amount: number
          tokens_sold_before: number | null
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          block_number?: number | null
          bonding_curve_price: number
          created_at?: string
          id?: string
          price_per_token: number
          prompt_amount: number
          token_amount: number
          tokens_sold_before?: number | null
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          block_number?: number | null
          bonding_curve_price?: number
          created_at?: string
          id?: string
          price_per_token?: number
          prompt_amount?: number
          token_amount?: number
          tokens_sold_before?: number | null
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_token_transactions: {
        Row: {
          agent_id: string
          block_number: number | null
          created_at: string | null
          id: string
          price_per_token: number
          prompt_amount: number
          status: string | null
          token_amount: number
          transaction_hash: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          block_number?: number | null
          created_at?: string | null
          id?: string
          price_per_token: number
          prompt_amount: number
          status?: string | null
          token_amount: number
          transaction_hash?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          block_number?: number | null
          created_at?: string | null
          id?: string
          price_per_token?: number
          prompt_amount?: number
          status?: string | null
          token_amount?: number
          transaction_hash?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_token_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_token_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_token_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_token_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_token_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          allow_automated_trading: boolean | null
          avatar_url: string | null
          block_number: number | null
          bonding_curve_phase: string | null
          bonding_curve_supply: number | null
          category: string | null
          chain_id: number | null
          circulating_supply: number | null
          created_at: string
          created_p0: number | null
          created_p1: number | null
          created_prompt_usd_rate: number | null
          creation_cost: number | null
          creation_expires_at: string | null
          creation_locked: boolean | null
          creation_mode: string | null
          creator_ens_name: string | null
          creator_id: string | null
          creator_prebuy_amount: number | null
          creator_wallet_address: string | null
          current_price: number
          deployed_at: string | null
          deployment_method: string | null
          deployment_status: string | null
          deployment_tx_hash: string | null
          deployment_verified: boolean | null
          description: string | null
          failed_at: string | null
          failure_reason: string | null
          framework: string | null
          graduation_event_id: string | null
          graduation_mode: string | null
          graduation_threshold: number | null
          id: string
          is_active: boolean | null
          market_cap: number | null
          market_cap_usd: number | null
          max_trade_amount: number | null
          migration_completed_at: string | null
          migration_validated: boolean | null
          name: string
          network_environment: string | null
          price_change_24h: number | null
          pricing_model: string | null
          project_pitch: string | null
          prompt_raised: number | null
          prompt_usd_rate: number | null
          shares_sold: number | null
          status: string | null
          symbol: string
          target_market_cap_usd: number | null
          test_mode: boolean | null
          token_address: string | null
          token_contract_address: string | null
          token_graduated: boolean | null
          token_holders: number | null
          total_supply: number | null
          trading_wallet_address: string | null
          twitter_api_configured: boolean | null
          twitter_api_encrypted_credentials: string | null
          twitter_url: string | null
          twitter_username: string | null
          updated_at: string
          volume_24h: number | null
          website_url: string | null
        }
        Insert: {
          allow_automated_trading?: boolean | null
          avatar_url?: string | null
          block_number?: number | null
          bonding_curve_phase?: string | null
          bonding_curve_supply?: number | null
          category?: string | null
          chain_id?: number | null
          circulating_supply?: number | null
          created_at?: string
          created_p0?: number | null
          created_p1?: number | null
          created_prompt_usd_rate?: number | null
          creation_cost?: number | null
          creation_expires_at?: string | null
          creation_locked?: boolean | null
          creation_mode?: string | null
          creator_ens_name?: string | null
          creator_id?: string | null
          creator_prebuy_amount?: number | null
          creator_wallet_address?: string | null
          current_price?: number
          deployed_at?: string | null
          deployment_method?: string | null
          deployment_status?: string | null
          deployment_tx_hash?: string | null
          deployment_verified?: boolean | null
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          framework?: string | null
          graduation_event_id?: string | null
          graduation_mode?: string | null
          graduation_threshold?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          market_cap_usd?: number | null
          max_trade_amount?: number | null
          migration_completed_at?: string | null
          migration_validated?: boolean | null
          name: string
          network_environment?: string | null
          price_change_24h?: number | null
          pricing_model?: string | null
          project_pitch?: string | null
          prompt_raised?: number | null
          prompt_usd_rate?: number | null
          shares_sold?: number | null
          status?: string | null
          symbol: string
          target_market_cap_usd?: number | null
          test_mode?: boolean | null
          token_address?: string | null
          token_contract_address?: string | null
          token_graduated?: boolean | null
          token_holders?: number | null
          total_supply?: number | null
          trading_wallet_address?: string | null
          twitter_api_configured?: boolean | null
          twitter_api_encrypted_credentials?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string
          volume_24h?: number | null
          website_url?: string | null
        }
        Update: {
          allow_automated_trading?: boolean | null
          avatar_url?: string | null
          block_number?: number | null
          bonding_curve_phase?: string | null
          bonding_curve_supply?: number | null
          category?: string | null
          chain_id?: number | null
          circulating_supply?: number | null
          created_at?: string
          created_p0?: number | null
          created_p1?: number | null
          created_prompt_usd_rate?: number | null
          creation_cost?: number | null
          creation_expires_at?: string | null
          creation_locked?: boolean | null
          creation_mode?: string | null
          creator_ens_name?: string | null
          creator_id?: string | null
          creator_prebuy_amount?: number | null
          creator_wallet_address?: string | null
          current_price?: number
          deployed_at?: string | null
          deployment_method?: string | null
          deployment_status?: string | null
          deployment_tx_hash?: string | null
          deployment_verified?: boolean | null
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          framework?: string | null
          graduation_event_id?: string | null
          graduation_mode?: string | null
          graduation_threshold?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          market_cap_usd?: number | null
          max_trade_amount?: number | null
          migration_completed_at?: string | null
          migration_validated?: boolean | null
          name?: string
          network_environment?: string | null
          price_change_24h?: number | null
          pricing_model?: string | null
          project_pitch?: string | null
          prompt_raised?: number | null
          prompt_usd_rate?: number | null
          shares_sold?: number | null
          status?: string | null
          symbol?: string
          target_market_cap_usd?: number | null
          test_mode?: boolean | null
          token_address?: string | null
          token_contract_address?: string | null
          token_graduated?: boolean | null
          token_holders?: number | null
          total_supply?: number | null
          trading_wallet_address?: string | null
          twitter_api_configured?: boolean | null
          twitter_api_encrypted_credentials?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string
          volume_24h?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_graduation_event_id_fkey"
            columns: ["graduation_event_id"]
            isOneToOne: false
            referencedRelation: "agent_graduation_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agents_backup: {
        Row: {
          avatar_url: string | null
          bonding_curve_supply: number | null
          category: string | null
          circulating_supply: number | null
          created_at: string | null
          creation_cost: number | null
          creator_ens_name: string | null
          creator_id: string | null
          creator_wallet_address: string | null
          current_price: number | null
          description: string | null
          framework: string | null
          graduation_event_id: string | null
          graduation_threshold: number | null
          id: string | null
          is_active: boolean | null
          market_cap: number | null
          name: string | null
          price_change_24h: number | null
          prompt_raised: number | null
          status: string | null
          symbol: string | null
          test_mode: boolean | null
          token_address: string | null
          token_graduated: boolean | null
          token_holders: number | null
          total_supply: number | null
          twitter_api_configured: boolean | null
          twitter_api_encrypted_credentials: string | null
          twitter_url: string | null
          twitter_username: string | null
          updated_at: string | null
          volume_24h: number | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bonding_curve_supply?: number | null
          category?: string | null
          circulating_supply?: number | null
          created_at?: string | null
          creation_cost?: number | null
          creator_ens_name?: string | null
          creator_id?: string | null
          creator_wallet_address?: string | null
          current_price?: number | null
          description?: string | null
          framework?: string | null
          graduation_event_id?: string | null
          graduation_threshold?: number | null
          id?: string | null
          is_active?: boolean | null
          market_cap?: number | null
          name?: string | null
          price_change_24h?: number | null
          prompt_raised?: number | null
          status?: string | null
          symbol?: string | null
          test_mode?: boolean | null
          token_address?: string | null
          token_graduated?: boolean | null
          token_holders?: number | null
          total_supply?: number | null
          twitter_api_configured?: boolean | null
          twitter_api_encrypted_credentials?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string | null
          volume_24h?: number | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bonding_curve_supply?: number | null
          category?: string | null
          circulating_supply?: number | null
          created_at?: string | null
          creation_cost?: number | null
          creator_ens_name?: string | null
          creator_id?: string | null
          creator_wallet_address?: string | null
          current_price?: number | null
          description?: string | null
          framework?: string | null
          graduation_event_id?: string | null
          graduation_threshold?: number | null
          id?: string | null
          is_active?: boolean | null
          market_cap?: number | null
          name?: string | null
          price_change_24h?: number | null
          prompt_raised?: number | null
          status?: string | null
          symbol?: string | null
          test_mode?: boolean | null
          token_address?: string | null
          token_graduated?: boolean | null
          token_holders?: number | null
          total_supply?: number | null
          twitter_api_configured?: boolean | null
          twitter_api_encrypted_credentials?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string | null
          volume_24h?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      automated_action_logs: {
        Row: {
          action_data: Json
          action_type: string
          agent_id: string
          authorized: boolean
          created_at: string | null
          executed: boolean
          id: string
        }
        Insert: {
          action_data: Json
          action_type: string
          agent_id: string
          authorized?: boolean
          created_at?: string | null
          executed?: boolean
          id?: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          agent_id?: string
          authorized?: boolean
          created_at?: string | null
          executed?: boolean
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_action_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "automated_action_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_action_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "automated_action_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_action_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_drawings: {
        Row: {
          agent_id: string
          created_at: string
          drawing_data: Json
          drawing_type: string
          id: string
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          agent_id: string
          created_at?: string
          drawing_data: Json
          drawing_type: string
          id: string
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          agent_id?: string
          created_at?: string
          drawing_data?: Json
          drawing_type?: string
          id?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_end: string | null
          execution_start: string
          id: string
          job_name: string
          metadata: Json | null
          retry_count: number | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          job_name: string
          metadata?: Json | null
          retry_count?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          job_name?: string
          metadata?: Json | null
          retry_count?: number | null
          status?: string
        }
        Relationships: []
      }
      deployed_contracts: {
        Row: {
          agent_id: string | null
          contract_address: string
          contract_type: string
          created_at: string
          deployment_timestamp: string
          id: string
          is_active: boolean
          name: string | null
          network: string
          symbol: string | null
          transaction_hash: string | null
          updated_at: string
          version: string
        }
        Insert: {
          agent_id?: string | null
          contract_address: string
          contract_type: string
          created_at?: string
          deployment_timestamp?: string
          id?: string
          is_active?: boolean
          name?: string | null
          network?: string
          symbol?: string | null
          transaction_hash?: string | null
          updated_at?: string
          version?: string
        }
        Update: {
          agent_id?: string | null
          contract_address?: string
          contract_type?: string
          created_at?: string
          deployment_timestamp?: string
          id?: string
          is_active?: boolean
          name?: string | null
          network?: string
          symbol?: string | null
          transaction_hash?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployed_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deployed_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployed_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deployed_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployed_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      deployed_contracts_audit: {
        Row: {
          agent_id: string | null
          block_number: number
          block_timestamp: string
          bytecode_hash: string | null
          bytecode_length: number | null
          chain_id: number
          created_at: string
          deployer_address: string
          deployment_cost_usd: number | null
          deployment_cost_wei: number | null
          deployment_method: string
          deployment_tx_hash: string
          effective_gas_price: number | null
          factory_address: string | null
          factory_parse_method: string | null
          factory_version: string | null
          gas_used: number | null
          id: string
          runtime_bytecode_hash: string | null
          token_address: string
          token_address_checksum: string
          token_name: string | null
          token_symbol: string | null
          updated_at: string
          verification_method: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          agent_id?: string | null
          block_number: number
          block_timestamp: string
          bytecode_hash?: string | null
          bytecode_length?: number | null
          chain_id?: number
          created_at?: string
          deployer_address: string
          deployment_cost_usd?: number | null
          deployment_cost_wei?: number | null
          deployment_method: string
          deployment_tx_hash: string
          effective_gas_price?: number | null
          factory_address?: string | null
          factory_parse_method?: string | null
          factory_version?: string | null
          gas_used?: number | null
          id?: string
          runtime_bytecode_hash?: string | null
          token_address: string
          token_address_checksum: string
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          agent_id?: string | null
          block_number?: number
          block_timestamp?: string
          bytecode_hash?: string | null
          bytecode_length?: number | null
          chain_id?: number
          created_at?: string
          deployer_address?: string
          deployment_cost_usd?: number | null
          deployment_cost_wei?: number | null
          deployment_method?: string
          deployment_tx_hash?: string
          effective_gas_price?: number | null
          factory_address?: string | null
          factory_parse_method?: string | null
          factory_version?: string | null
          gas_used?: number | null
          id?: string
          runtime_bytecode_hash?: string | null
          token_address?: string
          token_address_checksum?: string
          token_name?: string | null
          token_symbol?: string | null
          updated_at?: string
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployed_contracts_audit_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deployed_contracts_audit_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployed_contracts_audit_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deployed_contracts_audit_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployed_contracts_audit_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      deployed_contracts_backup: {
        Row: {
          agent_id: string | null
          contract_address: string | null
          contract_type: string | null
          created_at: string | null
          deployment_timestamp: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          network: string | null
          symbol: string | null
          transaction_hash: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          agent_id?: string | null
          contract_address?: string | null
          contract_type?: string | null
          created_at?: string | null
          deployment_timestamp?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          network?: string | null
          symbol?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          agent_id?: string | null
          contract_address?: string | null
          contract_type?: string | null
          created_at?: string | null
          deployment_timestamp?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          network?: string | null
          symbol?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      deployment_metrics: {
        Row: {
          deployment_id: string | null
          error_message: string | null
          execution_time_ms: number
          function_name: string
          gas_used: number | null
          id: string
          method_used: string | null
          recorded_at: string
          rpc_used: string | null
          success: boolean
        }
        Insert: {
          deployment_id?: string | null
          error_message?: string | null
          execution_time_ms: number
          function_name: string
          gas_used?: number | null
          id?: string
          method_used?: string | null
          recorded_at?: string
          rpc_used?: string | null
          success: boolean
        }
        Update: {
          deployment_id?: string | null
          error_message?: string | null
          execution_time_ms?: number
          function_name?: string
          gas_used?: number | null
          id?: string
          method_used?: string | null
          recorded_at?: string
          rpc_used?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "deployment_metrics_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "deployed_contracts_audit"
            referencedColumns: ["id"]
          },
        ]
      }
      dex_trades: {
        Row: {
          agent_id: string
          aggregator_used: boolean | null
          created_at: string
          dst_amount: number
          dst_token: string
          executed_price: number
          id: string
          slippage_percent: number | null
          src_amount: number
          src_token: string
          trade_type: string
          transaction_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          aggregator_used?: boolean | null
          created_at?: string
          dst_amount: number
          dst_token: string
          executed_price: number
          id?: string
          slippage_percent?: number | null
          src_amount: number
          src_token: string
          trade_type: string
          transaction_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          aggregator_used?: boolean | null
          created_at?: string
          dst_amount?: number
          dst_token?: string
          executed_price?: number
          id?: string
          slippage_percent?: number | null
          src_amount?: number
          src_token?: string
          trade_type?: string
          transaction_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dex_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "dex_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dex_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "dex_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dex_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_analytics: {
        Row: {
          agent_id: string
          created_at: string
          days_to_graduation: number | null
          dex_price: number | null
          dex_volume_24h: number | null
          final_price: number
          final_prompt_raised: number
          graduation_roi_percent: number | null
          holder_count: number | null
          id: string
          liquidity_depth_score: number | null
          lp_lock_tx_hash: string | null
          lp_pool_address: string | null
          lp_prompt_amount: number
          lp_token_amount: number
          lp_unlock_date: string | null
          lp_value_usd: number | null
          platform_tokens_value_usd: number | null
          post_graduation_volume: number | null
          pre_graduation_volume: number | null
          price_impact_percent: number | null
          trading_activity_score: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          days_to_graduation?: number | null
          dex_price?: number | null
          dex_volume_24h?: number | null
          final_price: number
          final_prompt_raised: number
          graduation_roi_percent?: number | null
          holder_count?: number | null
          id?: string
          liquidity_depth_score?: number | null
          lp_lock_tx_hash?: string | null
          lp_pool_address?: string | null
          lp_prompt_amount: number
          lp_token_amount?: number
          lp_unlock_date?: string | null
          lp_value_usd?: number | null
          platform_tokens_value_usd?: number | null
          post_graduation_volume?: number | null
          pre_graduation_volume?: number | null
          price_impact_percent?: number | null
          trading_activity_score?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          days_to_graduation?: number | null
          dex_price?: number | null
          dex_volume_24h?: number | null
          final_price?: number
          final_prompt_raised?: number
          graduation_roi_percent?: number | null
          holder_count?: number | null
          id?: string
          liquidity_depth_score?: number | null
          lp_lock_tx_hash?: string | null
          lp_pool_address?: string | null
          lp_prompt_amount?: number
          lp_token_amount?: number
          lp_unlock_date?: string | null
          lp_value_usd?: number | null
          platform_tokens_value_usd?: number | null
          post_graduation_volume?: number | null
          pre_graduation_volume?: number | null
          price_impact_percent?: number | null
          trading_activity_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_graduation_analytics_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "fk_graduation_analytics_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_graduation_analytics_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "fk_graduation_analytics_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_graduation_analytics_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_policies: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          rules: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          rules: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          rules?: Json
        }
        Relationships: []
      }
      graduation_transaction_logs: {
        Row: {
          block_number: number | null
          created_at: string
          error_details: string | null
          gas_used: number | null
          graduation_event_id: string
          id: string
          status: string
          transaction_hash: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          block_number?: number | null
          created_at?: string
          error_details?: string | null
          gas_used?: number | null
          graduation_event_id: string
          id?: string
          status?: string
          transaction_hash?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          block_number?: number | null
          created_at?: string
          error_details?: string | null
          gas_used?: number | null
          graduation_event_id?: string
          id?: string
          status?: string
          transaction_hash?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_transaction_logs_graduation_event_id_fkey"
            columns: ["graduation_event_id"]
            isOneToOne: false
            referencedRelation: "agent_graduation_events"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards_cache: {
        Row: {
          id: string
          metric: Database["public"]["Enums"]["leaderboard_metric"]
          rankings: Json
          timeframe: Database["public"]["Enums"]["leaderboard_timeframe"]
          updated_at: string
        }
        Insert: {
          id?: string
          metric: Database["public"]["Enums"]["leaderboard_metric"]
          rankings?: Json
          timeframe: Database["public"]["Enums"]["leaderboard_timeframe"]
          updated_at?: string
        }
        Update: {
          id?: string
          metric?: Database["public"]["Enums"]["leaderboard_metric"]
          rankings?: Json
          timeframe?: Database["public"]["Enums"]["leaderboard_timeframe"]
          updated_at?: string
        }
        Relationships: []
      }
      migration_audit: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          migration_phase: string
          new_data: Json
          old_data: Json
          validation_results: Json | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          migration_phase: string
          new_data: Json
          old_data: Json
          validation_results?: Json | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          migration_phase?: string
          new_data?: Json
          old_data?: Json
          validation_results?: Json | null
        }
        Relationships: []
      }
      pending_trades: {
        Row: {
          agent_id: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          signal: Json
          status: string
        }
        Insert: {
          agent_id: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          signal: Json
          status?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          signal?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "pending_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "pending_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_trades_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_allocations: {
        Row: {
          agent_id: string
          allocation_tx_hash: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          platform_amount: number
          status: string | null
          token_address: string
          vault_address: string
        }
        Insert: {
          agent_id: string
          allocation_tx_hash?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform_amount?: number
          status?: string | null
          token_address: string
          vault_address: string
        }
        Update: {
          agent_id?: string
          allocation_tx_hash?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          platform_amount?: number
          status?: string | null
          token_address?: string
          vault_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_allocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "platform_allocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_allocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "platform_allocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_allocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_health_snapshots: {
        Row: {
          avg_lp_value_usd: number
          created_at: string
          graduated_agents_count: number
          id: string
          low_liquidity_agents: number
          total_platform_tokens_value_usd: number
        }
        Insert: {
          avg_lp_value_usd?: number
          created_at?: string
          graduated_agents_count?: number
          id?: string
          low_liquidity_agents?: number
          total_platform_tokens_value_usd?: number
        }
        Update: {
          avg_lp_value_usd?: number
          created_at?: string
          graduated_agents_count?: number
          id?: string
          low_liquidity_agents?: number
          total_platform_tokens_value_usd?: number
        }
        Relationships: []
      }
      platform_revenue: {
        Row: {
          agent_id: string | null
          amount: number
          created_at: string
          id: string
          network: string
          revenue_type: string
          transaction_hash: string | null
        }
        Insert: {
          agent_id?: string | null
          amount: number
          created_at?: string
          id?: string
          network: string
          revenue_type: string
          transaction_hash?: string | null
        }
        Update: {
          agent_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          network?: string
          revenue_type?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_revenue_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "platform_revenue_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_revenue_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "platform_revenue_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_revenue_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          agent_id: string
          created_at: string
          direction: Database["public"]["Enums"]["alert_direction"]
          id: string
          owner_id: string
          status: Database["public"]["Enums"]["alert_status"]
          threshold_price: number
          triggered_at: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["alert_direction"]
          id?: string
          owner_id: string
          status?: Database["public"]["Enums"]["alert_status"]
          threshold_price: number
          triggered_at?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["alert_direction"]
          id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["alert_status"]
          threshold_price?: number
          triggered_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "price_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "price_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_method: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          ens_name: string | null
          id: string
          resolved_wallet: string | null
          terms_accepted_at: string | null
          total_portfolio_value: number | null
          twitter_access_token: string | null
          twitter_access_token_secret: string | null
          twitter_avatar_url: string | null
          twitter_display_name: string | null
          twitter_id: string | null
          twitter_username: string | null
          updated_at: string
          user_id: string
          username: string | null
          wallet_address: string | null
          wallet_last_updated: string | null
        }
        Insert: {
          auth_method?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          ens_name?: string | null
          id?: string
          resolved_wallet?: string | null
          terms_accepted_at?: string | null
          total_portfolio_value?: number | null
          twitter_access_token?: string | null
          twitter_access_token_secret?: string | null
          twitter_avatar_url?: string | null
          twitter_display_name?: string | null
          twitter_id?: string | null
          twitter_username?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          wallet_address?: string | null
          wallet_last_updated?: string | null
        }
        Update: {
          auth_method?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          ens_name?: string | null
          id?: string
          resolved_wallet?: string | null
          terms_accepted_at?: string | null
          total_portfolio_value?: number | null
          twitter_access_token?: string | null
          twitter_access_token_secret?: string | null
          twitter_avatar_url?: string | null
          twitter_display_name?: string | null
          twitter_id?: string | null
          twitter_username?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          wallet_address?: string | null
          wallet_last_updated?: string | null
        }
        Relationships: []
      }
      prompt_fx: {
        Row: {
          asof: string
          fx_rate_usd: number
        }
        Insert: {
          asof: string
          fx_rate_usd: number
        }
        Update: {
          asof?: string
          fx_rate_usd?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      revenue_config: {
        Row: {
          agent_id: string
          created_at: string
          creator_split: number
          creator_wallet_address: string | null
          fee_percent: number
          id: string
          platform_split: number
          platform_wallet_address: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          creator_split?: number
          creator_wallet_address?: string | null
          fee_percent?: number
          id?: string
          platform_split?: number
          platform_wallet_address?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          creator_split?: number
          creator_wallet_address?: string | null
          fee_percent?: number
          id?: string
          platform_split?: number
          platform_wallet_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_config_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "revenue_config_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_config_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "revenue_config_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_config_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_distributions: {
        Row: {
          agent_id: string
          created_at: string
          creator_amount: number
          creator_wallet: string | null
          error_reason: string | null
          fee_amount: number
          has_failures: boolean
          id: string
          platform_amount: number
          platform_wallet: string | null
          processed_by: string | null
          retry_count: number
          status: Database["public"]["Enums"]["revenue_status"]
          total_revenue: number
          transaction_hash: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          creator_amount: number
          creator_wallet?: string | null
          error_reason?: string | null
          fee_amount: number
          has_failures?: boolean
          id?: string
          platform_amount: number
          platform_wallet?: string | null
          processed_by?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["revenue_status"]
          total_revenue: number
          transaction_hash?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          creator_amount?: number
          creator_wallet?: string | null
          error_reason?: string | null
          fee_amount?: number
          has_failures?: boolean
          id?: string
          platform_amount?: number
          platform_wallet?: string | null
          processed_by?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["revenue_status"]
          total_revenue?: number
          transaction_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_distributions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "revenue_distributions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_distributions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "revenue_distributions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_distributions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          agent_id: string
          created_at: string
          creator_amount: number
          fee_amount: number
          id: string
          metadata: Json | null
          platform_amount: number
          source: string
          status: string
          timestamp: string
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          creator_amount?: number
          fee_amount?: number
          id?: string
          metadata?: Json | null
          platform_amount?: number
          source: string
          status?: string
          timestamp?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          creator_amount?: number
          fee_amount?: number
          id?: string
          metadata?: Json | null
          platform_amount?: number
          source?: string
          status?: string
          timestamp?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      revenue_failures: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          distribution_id: string | null
          failure_reason: string
          id: string
          intended_recipient: string
          last_retry_at: string | null
          max_retries: number
          recipient_type: string
          resolved_at: string | null
          retry_count: number
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          distribution_id?: string | null
          failure_reason: string
          id?: string
          intended_recipient: string
          last_retry_at?: string | null
          max_retries?: number
          recipient_type: string
          resolved_at?: string | null
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          distribution_id?: string | null
          failure_reason?: string
          id?: string
          intended_recipient?: string
          last_retry_at?: string | null
          max_retries?: number
          recipient_type?: string
          resolved_at?: string | null
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_failures_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "revenue_failures_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_failures_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "revenue_failures_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_failures_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_failures_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "revenue_distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_metadata: {
        Row: {
          author: string | null
          canonical_url: string | null
          created_at: string | null
          description: string | null
          description_template: string | null
          favicon_url: string | null
          focus_keyword: string | null
          id: string
          is_dynamic: boolean | null
          is_global: boolean | null
          is_indexable: boolean | null
          keywords: string | null
          modified_date: string | null
          og_image_url: string | null
          og_type: string | null
          page_name: string
          page_path: string
          publish_date: string | null
          robots_directives: string | null
          sitemap_changefreq: string | null
          sitemap_priority: number | null
          structured_data_type: string | null
          title: string | null
          title_template: string | null
          twitter_card_type: string | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          created_at?: string | null
          description?: string | null
          description_template?: string | null
          favicon_url?: string | null
          focus_keyword?: string | null
          id?: string
          is_dynamic?: boolean | null
          is_global?: boolean | null
          is_indexable?: boolean | null
          keywords?: string | null
          modified_date?: string | null
          og_image_url?: string | null
          og_type?: string | null
          page_name: string
          page_path: string
          publish_date?: string | null
          robots_directives?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          structured_data_type?: string | null
          title?: string | null
          title_template?: string | null
          twitter_card_type?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          created_at?: string | null
          description?: string | null
          description_template?: string | null
          favicon_url?: string | null
          focus_keyword?: string | null
          id?: string
          is_dynamic?: boolean | null
          is_global?: boolean | null
          is_indexable?: boolean | null
          keywords?: string | null
          modified_date?: string | null
          og_image_url?: string | null
          og_type?: string | null
          page_name?: string
          page_path?: string
          publish_date?: string | null
          robots_directives?: string | null
          sitemap_changefreq?: string | null
          sitemap_priority?: number | null
          structured_data_type?: string | null
          title?: string | null
          title_template?: string | null
          twitter_card_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          agent_id: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          is_resolved: boolean
          message: string
          metadata: Json
          resolved_at: string | null
          severity: string
          type: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_resolved?: boolean
          message: string
          metadata?: Json
          resolved_at?: string | null
          severity?: string
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_resolved?: boolean
          message?: string
          metadata?: Json
          resolved_at?: string | null
          severity?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "system_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "system_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_rejections_log: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          metadata: Json | null
          rejection_reason: string
          trade_amount: number
          trade_type: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          rejection_reason: string
          trade_amount: number
          trade_type: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          rejection_reason?: string
          trade_amount?: number
          trade_type?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          agent_id: string
          block_number: number | null
          created_at: string
          fees: number | null
          id: string
          price: number
          quantity: number
          status: string | null
          total_amount: number
          transaction_hash: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          agent_id: string
          block_number?: number | null
          created_at?: string
          fees?: number | null
          id?: string
          price: number
          quantity: number
          status?: string | null
          total_amount: number
          transaction_hash?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          agent_id?: string
          block_number?: number | null
          created_at?: string
          fees?: number | null
          id?: string
          price?: number
          quantity?: number
          status?: string | null
          total_amount?: number
          transaction_hash?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          network: string
          platform_allocation_percent: number | null
          platform_vault_address: string | null
          treasury_address: string
          updated_at: string
          vault_deploy_tx: string | null
          vault_deployed_at: string | null
          vault_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          network: string
          platform_allocation_percent?: number | null
          platform_vault_address?: string | null
          treasury_address: string
          updated_at?: string
          vault_deploy_tx?: string | null
          vault_deployed_at?: string | null
          vault_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          network?: string
          platform_allocation_percent?: number | null
          platform_vault_address?: string | null
          treasury_address?: string
          updated_at?: string
          vault_deploy_tx?: string | null
          vault_deployed_at?: string | null
          vault_notes?: string | null
        }
        Relationships: []
      }
      user_agent_holdings: {
        Row: {
          agent_id: string
          average_buy_price: number | null
          created_at: string
          current_value: number | null
          id: string
          profit_loss: number | null
          profit_loss_percentage: number | null
          quantity: number
          total_invested: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          average_buy_price?: number | null
          created_at?: string
          current_value?: number | null
          id?: string
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          quantity?: number
          total_invested?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          average_buy_price?: number | null
          created_at?: string
          current_value?: number | null
          id?: string
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          quantity?: number
          total_invested?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agent_holdings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "user_agent_holdings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_agent_holdings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "user_agent_holdings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_agent_holdings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_token_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          test_mode: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          test_mode?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          test_mode?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          owner_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          owner_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_metrics_normalized"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "watchlists_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_prices_latest"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "watchlists_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "token_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agent_metrics_normalized: {
        Row: {
          agent_id: string | null
          circulating_supply: number | null
          fdv_prompt: number | null
          fdv_usd: number | null
          fx: number | null
          fx_staleness_seconds: number | null
          market_cap_usd: number | null
          mcirc_prompt: number | null
          mcirc_usd: number | null
          price_prompt: number | null
          price_usd: number | null
          prompt_usd_rate: number | null
          supply_policy: string | null
          total_supply: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      agent_prices: {
        Row: {
          dynamic_price: number | null
          id: string | null
          is_active: boolean | null
          market_cap: number | null
          name: string | null
          prompt_raised: number | null
          static_price: number | null
          symbol: string | null
          test_mode: boolean | null
          token_graduated: boolean | null
          token_holders: number | null
          volume_24h: number | null
        }
        Insert: {
          dynamic_price?: never
          id?: string | null
          is_active?: boolean | null
          market_cap?: number | null
          name?: string | null
          prompt_raised?: number | null
          static_price?: number | null
          symbol?: string | null
          test_mode?: boolean | null
          token_graduated?: boolean | null
          token_holders?: number | null
          volume_24h?: number | null
        }
        Update: {
          dynamic_price?: never
          id?: string | null
          is_active?: boolean | null
          market_cap?: number | null
          name?: string | null
          prompt_raised?: number | null
          static_price?: number | null
          symbol?: string | null
          test_mode?: boolean | null
          token_graduated?: boolean | null
          token_holders?: number | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      agent_prices_latest: {
        Row: {
          agent_id: string | null
          avatar_url: string | null
          category: string | null
          change_24h_pct: number | null
          holders: number | null
          is_graduated: boolean | null
          mc_prompt: number | null
          mc_usd: number | null
          name: string | null
          price_prompt: number | null
          price_usd: number | null
          prompt_raised: number | null
          symbol: string | null
          updated_at: string | null
          volume_24h: number | null
        }
        Relationships: []
      }
      agent_usd_raised: {
        Row: {
          agent_id: string | null
          prompt_raised_total: number | null
          usd_raised_total: number | null
        }
        Relationships: []
      }
      deployment_monitoring: {
        Row: {
          avg_execution_time_ms: number | null
          failed_executions: number | null
          function_name: string | null
          hour: string | null
          max_execution_time_ms: number | null
          min_execution_time_ms: number | null
          success_rate_percent: number | null
          successful_executions: number | null
          total_executions: number | null
        }
        Relationships: []
      }
      token_metadata_cache: {
        Row: {
          avatar_url: string | null
          bonding_curve_supply: number | null
          category: string | null
          chain_id: number | null
          created_at: string | null
          creator_ens_name: string | null
          creator_id: string | null
          creator_wallet_address: string | null
          current_price: number | null
          demo_videos: Json | null
          deployed_at: string | null
          deployment_status: string | null
          deployment_tx_hash: string | null
          deployment_verified: boolean | null
          description: string | null
          discord_url: string | null
          framework: string | null
          id: string | null
          is_active: boolean | null
          market_cap: number | null
          name: string | null
          network_environment: string | null
          price_change_24h: number | null
          prompt_raised: number | null
          screenshots: Json | null
          status: string | null
          symbol: string | null
          telegram_url: string | null
          test_mode: boolean | null
          token_address: string | null
          token_contract_address: string | null
          token_graduated: boolean | null
          token_holders: number | null
          twitter_url: string | null
          twitter_username: string | null
          updated_at: string | null
          volume_24h: number | null
          website_url: string | null
          whitepaper_url: string | null
          youtube_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      atomic_claim_reward: {
        Args: {
          p_agent_id: string
          p_claim_type: string
          p_holder_address: string
        }
        Returns: Json
      }
      atomic_update_agent_state: {
        Args: {
          p_agent_id: string
          p_new_price: number
          p_prompt_delta: number
          p_shares_delta: number
        }
        Returns: Json
      }
      atomic_update_position: {
        Args: { p_agent_id: string; p_delta: number; p_holder_address: string }
        Returns: Json
      }
      calculate_deployment_cost_usd: {
        Args: {
          eth_price_usd_param?: number
          gas_price_param: number
          gas_used_param: number
        }
        Returns: number
      }
      calculate_prompt_from_tokens: {
        Args: { current_tokens_sold: number; token_amount: number }
        Returns: {
          average_price: number
          new_price: number
          new_tokens_sold: number
          prompt_amount: number
        }[]
      }
      calculate_tokens_from_prompt: {
        Args: { current_tokens_sold: number; prompt_amount: number }
        Returns: {
          average_price: number
          new_price: number
          new_tokens_sold: number
          token_amount: number
        }[]
      }
      can_trade_agent: {
        Args: { p_agent_id: string; p_user_id: string }
        Returns: boolean
      }
      check_price_consistency: {
        Args: never
        Returns: {
          agent_id: string
          agent_name: string
          difference_percent: number
          dynamic_price: number
          static_price: number
        }[]
      }
      check_pricing_consistency: {
        Args: never
        Returns: {
          agent_id: string
          calculated_price: number
          fdv_diff_pct: number
          ok: boolean
          price_diff: number
          pricing_model: string
          stored_price: number
        }[]
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: Json
      }
      check_trading_permission: {
        Args: { p_agent_id: string; p_amount: number }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: number }
      complete_agent_graduation: {
        Args: {
          p_graduation_event_id: string
          p_liquidity_pool_address: string
          p_liquidity_tx_hash: string
        }
        Returns: Json
      }
      dry_run_agent_migration: {
        Args: { p_agent_id: string }
        Returns: {
          agent_id: string
          current_price: number
          current_pricing_model: string
          current_prompt_raised: number
          current_supply: number
          new_price: number
          new_supply: number
          price_change_percent: number
          validation_errors: string[]
          validation_passed: boolean
        }[]
      }
      evaluate_graduation: {
        Args: { p_agent_id: string }
        Returns: {
          met: Json
          policy_id: string
          policy_name: string
          should_graduate: boolean
          thresholds: Json
        }[]
      }
      execute_bonding_curve_trade: {
        Args: {
          p_agent_id: string
          p_expected_price?: number
          p_prompt_amount: number
          p_slippage?: number
          p_token_amount?: number
          p_trade_type: string
          p_user_id: string
        }
        Returns: Json
      }
      generate_agent_token_address: {
        Args: { p_agent_id: string }
        Returns: string
      }
      get_24h_change: {
        Args: { p_agent_id: string; p_timeframe?: string }
        Returns: number
      }
      get_admin_setting: { Args: { p_key: string }; Returns: Json }
      get_agent_current_price_v4: {
        Args: { p_agent_id: string }
        Returns: string
      }
      get_agent_ohlcv_data: {
        Args: {
          p_agent_id: string
          p_end_time?: string
          p_interval?: string
          p_start_time?: string
        }
        Returns: {
          close_price: number
          high_price: number
          low_price: number
          open_price: number
          time_bucket: string
          trade_count: number
          volume: number
        }[]
      }
      get_agent_safety_settings: {
        Args: { p_agent_id: string }
        Returns: {
          max_daily_trade_prompt: number
          max_single_trade_prompt: number
          max_user_daily_prompt: number
          trade_paused: boolean
        }[]
      }
      get_bonding_curve_config: {
        Args: never
        Returns: {
          graduation_threshold: number
          initial_prompt_reserve: number
          initial_token_reserve: number
          total_supply: number
          trading_fee_percent: number
        }[]
      }
      get_bonding_curve_config_v3: {
        Args: never
        Returns: {
          curve_supply: number
          graduation_threshold: number
          initial_prompt_reserve: number
          initial_token_reserve: number
          lp_lock_duration_days: number
          lp_prompt_allocation_percent: number
          lp_supply: number
          max_daily_trade_default: number
          max_single_trade_default: number
          max_user_daily_default: number
          p0: number
          p1: number
          total_supply: number
          trading_fee_percent: number
        }[]
      }
      get_bonding_curve_config_v4: {
        Args: never
        Returns: {
          curve_supply: number
          graduation_threshold: number
          initial_prompt_reserve: number
          initial_token_reserve: number
          lp_lock_duration_days: number
          lp_prompt_allocation_percent: number
          lp_supply: number
          max_daily_trade_default: number
          max_single_trade_default: number
          max_user_daily_default: number
          p0: number
          p1: number
          total_supply: number
          trading_fee_percent: number
        }[]
      }
      get_bonding_curve_invariant: { Args: never; Returns: number }
      get_current_bonding_curve_price: {
        Args: { tokens_sold: number }
        Returns: number
      }
      get_current_linear_price_v3: {
        Args: { p_tokens_sold: number }
        Returns: number
      }
      get_current_linear_price_v4: {
        Args: { p_tokens_sold: number }
        Returns: number
      }
      get_current_reserves: {
        Args: { tokens_sold: number }
        Returns: {
          prompt_reserve: number
          token_reserve: number
        }[]
      }
      get_current_user_id: { Args: never; Returns: string }
      get_curve_supply_now: { Args: { p_agent_id: string }; Returns: number }
      get_fx_asof: {
        Args: { p_ts: string }
        Returns: {
          asof: string
          fx: number
        }[]
      }
      get_liquidity_summary: {
        Args: { p_agent_id: string }
        Returns: {
          agent_id: string
          asof: string
          creation_mode: string
          fx: string
          graduation_mode: string
          lp_pair_amount: string
          lp_pair_symbol: string
          lp_percent: string
          lp_prompt: string
          lp_usd: string
          source: string
          status: string
        }[]
      }
      get_ohlc_from_trades: {
        Args: { p_agent_id: string; p_limit?: number; p_timeframe?: string }
        Returns: {
          bucket_time: string
          close_prompt: number
          high_prompt: number
          low_prompt: number
          open_prompt: number
          volume_agent: number
        }[]
      }
      get_ohlc_with_fx: {
        Args: { p_agent_id: string; p_limit?: number; p_timeframe: string }
        Returns: {
          c: string
          fx: string
          h: string
          l: string
          o: string
          t: string
          v: string
        }[]
      }
      get_price_from_prompt_v3: {
        Args: { p_prompt_raised: number }
        Returns: number
      }
      get_price_from_prompt_v4: {
        Args: { p_prompt_raised: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pg_try_advisory_xact_lock: { Args: { key: number }; Returns: boolean }
      refresh_agent_prices_latest: { Args: never; Returns: undefined }
      refresh_token_metadata_cache: { Args: never; Returns: number }
      rollback_agent_migration: { Args: { p_agent_id: string }; Returns: Json }
      set_admin_by_email: { Args: { _email: string }; Returns: undefined }
      set_user_as_admin: { Args: { _user_id: string }; Returns: undefined }
      simulate_price_impact: {
        Args: {
          p_agent_id: string
          p_prompt_amount: number
          p_trade_type?: string
        }
        Returns: {
          current_price: number
          estimated_tokens: number
          impact_price: number
          price_impact_percent: number
        }[]
      }
      tf_step_minutes: { Args: { tf: string }; Returns: number }
      tf_step_seconds: { Args: { tf: string }; Returns: number }
      tokens_sold_from_prompt_v3: {
        Args: { p_prompt_raised: number }
        Returns: number
      }
      tokens_sold_from_prompt_v4: {
        Args: { p_prompt_raised: number }
        Returns: number
      }
      unlock_expired_agents: { Args: never; Returns: number }
      update_admin_setting: {
        Args: {
          p_changed_by: string
          p_key: string
          p_reason?: string
          p_value: Json
        }
        Returns: undefined
      }
      validate_agent_migration: {
        Args: { p_agent_id: string }
        Returns: {
          is_valid: boolean
          validation_errors: string[]
        }[]
      }
      validate_trade_safety: {
        Args: {
          p_agent_id: string
          p_prompt_amount: number
          p_trade_type: string
          p_user_id: string
        }
        Returns: {
          is_valid: boolean
          rejection_reason: string
        }[]
      }
      verify_pending_deployments: { Args: never; Returns: number }
    }
    Enums: {
      alert_direction: "above" | "below"
      alert_status: "active" | "triggered" | "cancelled"
      app_role: "admin" | "user"
      leaderboard_metric:
        | "volume"
        | "liquidity"
        | "holders"
        | "growth"
        | "graduation"
      leaderboard_timeframe: "24h" | "7d" | "30d" | "all"
      revenue_status: "pending" | "completed" | "failed"
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
      alert_direction: ["above", "below"],
      alert_status: ["active", "triggered", "cancelled"],
      app_role: ["admin", "user"],
      leaderboard_metric: [
        "volume",
        "liquidity",
        "holders",
        "growth",
        "graduation",
      ],
      leaderboard_timeframe: ["24h", "7d", "30d", "all"],
      revenue_status: ["pending", "completed", "failed"],
    },
  },
} as const
