-- EMERGENCY FIX: Disable all automated trading immediately
UPDATE public.agents
SET
  status = 'INACTIVE',
  is_active = false
WHERE is_active = true;

-- Add consent and control fields to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS allow_automated_trading BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_trade_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS trading_wallet_address TEXT;

-- Create function to check trading permissions
CREATE OR REPLACE FUNCTION public.check_trading_permission(
  p_agent_id UUID,
  p_amount NUMERIC
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agents
    WHERE id = p_agent_id
    AND allow_automated_trading = true
    AND (max_trade_amount = 0 OR p_amount <= max_trade_amount)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create pending trades table for approval queue
CREATE TABLE IF NOT EXISTS public.pending_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  signal JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  amount NUMERIC NOT NULL DEFAULT 0
);

-- Enable RLS on pending trades
ALTER TABLE public.pending_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for pending trades
CREATE POLICY "Users can view pending trades for their agents" ON public.pending_trades
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = pending_trades.agent_id 
    AND agents.creator_id = auth.uid()::text
  )
);

CREATE POLICY "Users can approve pending trades for their agents" ON public.pending_trades
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = pending_trades.agent_id 
    AND agents.creator_id = auth.uid()::text
  )
);

-- Add audit trail for automated actions
CREATE TABLE IF NOT EXISTS public.automated_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  authorized BOOLEAN NOT NULL DEFAULT false,
  executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on action logs
ALTER TABLE public.automated_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action logs for their agents" ON public.automated_action_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = automated_action_logs.agent_id 
    AND agents.creator_id = auth.uid()::text
  )
);