export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
          whitepaper_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          avatar_url: string | null
          bonding_curve_supply: number | null
          category: string | null
          circulating_supply: number | null
          created_at: string
          creation_cost: number | null
          creator_ens_name: string | null
          creator_id: string | null
          creator_wallet_address: string | null
          current_price: number
          description: string | null
          framework: string | null
          graduation_threshold: number | null
          id: string
          is_active: boolean | null
          market_cap: number | null
          name: string
          price_change_24h: number | null
          prompt_raised: number | null
          status: string | null
          symbol: string
          test_mode: boolean | null
          token_address: string | null
          token_graduated: boolean | null
          token_holders: number | null
          total_supply: number | null
          twitter_api_configured: boolean | null
          twitter_api_encrypted_credentials: string | null
          twitter_url: string | null
          twitter_username: string | null
          updated_at: string
          volume_24h: number | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bonding_curve_supply?: number | null
          category?: string | null
          circulating_supply?: number | null
          created_at?: string
          creation_cost?: number | null
          creator_ens_name?: string | null
          creator_id?: string | null
          creator_wallet_address?: string | null
          current_price?: number
          description?: string | null
          framework?: string | null
          graduation_threshold?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          name: string
          price_change_24h?: number | null
          prompt_raised?: number | null
          status?: string | null
          symbol: string
          test_mode?: boolean | null
          token_address?: string | null
          token_graduated?: boolean | null
          token_holders?: number | null
          total_supply?: number | null
          twitter_api_configured?: boolean | null
          twitter_api_encrypted_credentials?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string
          volume_24h?: number | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bonding_curve_supply?: number | null
          category?: string | null
          circulating_supply?: number | null
          created_at?: string
          creation_cost?: number | null
          creator_ens_name?: string | null
          creator_id?: string | null
          creator_wallet_address?: string | null
          current_price?: number
          description?: string | null
          framework?: string | null
          graduation_threshold?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          name?: string
          price_change_24h?: number | null
          prompt_raised?: number | null
          status?: string | null
          symbol?: string
          test_mode?: boolean | null
          token_address?: string | null
          token_graduated?: boolean | null
          token_holders?: number | null
          total_supply?: number | null
          twitter_api_configured?: boolean | null
          twitter_api_encrypted_credentials?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string
          volume_24h?: number | null
          website_url?: string | null
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
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployed_contracts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
            referencedRelation: "agents"
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
          treasury_address: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          network: string
          treasury_address: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          network?: string
          treasury_address?: string
          updated_at?: string
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
            referencedRelation: "agents"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_prompt_from_tokens: {
        Args: { current_tokens_sold: number; token_amount: number }
        Returns: {
          prompt_amount: number
          new_tokens_sold: number
          new_price: number
          average_price: number
        }[]
      }
      calculate_tokens_from_prompt: {
        Args: { current_tokens_sold: number; prompt_amount: number }
        Returns: {
          token_amount: number
          new_tokens_sold: number
          new_price: number
          average_price: number
        }[]
      }
      execute_bonding_curve_trade: {
        Args: {
          p_agent_id: string
          p_user_id: string
          p_prompt_amount: number
          p_trade_type: string
          p_token_amount?: number
          p_expected_price?: number
          p_slippage?: number
        }
        Returns: Json
      }
      generate_agent_token_address: {
        Args: { p_agent_id: string }
        Returns: string
      }
      get_agent_ohlcv_data: {
        Args: {
          p_agent_id: string
          p_interval?: string
          p_start_time?: string
          p_end_time?: string
        }
        Returns: {
          time_bucket: string
          open_price: number
          high_price: number
          low_price: number
          close_price: number
          volume: number
          trade_count: number
        }[]
      }
      get_bonding_curve_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          initial_prompt_reserve: number
          initial_token_reserve: number
          total_supply: number
          graduation_threshold: number
          trading_fee_percent: number
        }[]
      }
      get_bonding_curve_invariant: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_current_bonding_curve_price: {
        Args: { tokens_sold: number }
        Returns: number
      }
      get_current_reserves: {
        Args: { tokens_sold: number }
        Returns: {
          prompt_reserve: number
          token_reserve: number
        }[]
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      set_admin_by_email: {
        Args: { _email: string }
        Returns: undefined
      }
      set_user_as_admin: {
        Args: { _user_id: string }
        Returns: undefined
      }
      simulate_price_impact: {
        Args: {
          p_agent_id: string
          p_prompt_amount: number
          p_trade_type?: string
        }
        Returns: {
          current_price: number
          impact_price: number
          price_impact_percent: number
          estimated_tokens: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
      revenue_status: ["pending", "completed", "failed"],
    },
  },
} as const
