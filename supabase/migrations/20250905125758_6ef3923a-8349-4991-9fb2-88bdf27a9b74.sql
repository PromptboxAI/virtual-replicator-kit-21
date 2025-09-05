-- Create graduation analytics table for Phase 5C
CREATE TABLE public.graduation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Pre-graduation metrics
    pre_graduation_volume NUMERIC DEFAULT 0,
    days_to_graduation INTEGER,
    final_prompt_raised NUMERIC NOT NULL,
    final_price NUMERIC NOT NULL,
    holder_count INTEGER DEFAULT 0,
    
    -- Post-graduation metrics  
    post_graduation_volume NUMERIC DEFAULT 0,
    lp_value_usd NUMERIC DEFAULT 0,
    price_impact_percent NUMERIC DEFAULT 0,
    dex_price NUMERIC,
    dex_volume_24h NUMERIC DEFAULT 0,
    
    -- Platform metrics
    platform_tokens_value_usd NUMERIC DEFAULT 0, -- Track 4M token allocation value
    lp_prompt_amount NUMERIC NOT NULL, -- 70% of raised PROMPT
    lp_token_amount NUMERIC NOT NULL DEFAULT 196000000, -- 196M tokens
    lp_pool_address TEXT,
    lp_lock_tx_hash TEXT,
    lp_unlock_date TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    graduation_roi_percent NUMERIC DEFAULT 0, -- ROI since launch
    liquidity_depth_score INTEGER DEFAULT 0, -- 1-10 score
    trading_activity_score INTEGER DEFAULT 0, -- 1-10 score
    
    CONSTRAINT fk_graduation_analytics_agent FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX idx_graduation_analytics_agent_id ON public.graduation_analytics(agent_id);
CREATE INDEX idx_graduation_analytics_created_at ON public.graduation_analytics(created_at);
CREATE INDEX idx_graduation_analytics_platform_value ON public.graduation_analytics(platform_tokens_value_usd);

-- Enable RLS
ALTER TABLE public.graduation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Graduation analytics are viewable by everyone" 
ON public.graduation_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage graduation analytics" 
ON public.graduation_analytics 
FOR ALL 
USING (false);