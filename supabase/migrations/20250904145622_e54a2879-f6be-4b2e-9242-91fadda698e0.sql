-- Create table to track DEX trades for graduated agents
CREATE TABLE IF NOT EXISTS public.dex_trades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id),
    user_id TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    src_token TEXT NOT NULL,
    dst_token TEXT NOT NULL,
    src_amount NUMERIC NOT NULL CHECK (src_amount > 0),
    dst_amount NUMERIC NOT NULL CHECK (dst_amount > 0),
    transaction_hash TEXT NOT NULL,
    executed_price NUMERIC NOT NULL CHECK (executed_price > 0),
    slippage_percent NUMERIC DEFAULT 3.0 CHECK (slippage_percent >= 0 AND slippage_percent <= 50),
    aggregator_used BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dex_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for DEX trades
CREATE POLICY "Users can view all DEX trades"
ON public.dex_trades
FOR SELECT
USING (true);

CREATE POLICY "Service can insert DEX trades"
ON public.dex_trades
FOR INSERT
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_dex_trades_agent_id ON public.dex_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_dex_trades_user_id ON public.dex_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_dex_trades_created_at ON public.dex_trades(created_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dex_trades_updated_at
    BEFORE UPDATE ON public.dex_trades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();