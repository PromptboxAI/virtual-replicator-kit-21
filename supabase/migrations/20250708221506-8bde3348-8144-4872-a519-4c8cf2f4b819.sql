-- Step 4: Update other tables to use TEXT user_id and recreate policies

-- Update user_agent_holdings
DROP TABLE IF EXISTS public.user_agent_holdings CASCADE;
CREATE TABLE public.user_agent_holdings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  quantity decimal(20,8) NOT NULL DEFAULT 0,
  average_buy_price decimal(20,8) DEFAULT 0,
  total_invested decimal(20,2) DEFAULT 0,
  current_value decimal(20,2) DEFAULT 0,
  profit_loss decimal(20,2) DEFAULT 0,
  profit_loss_percentage decimal(10,4) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

ALTER TABLE public.user_agent_holdings ENABLE ROW LEVEL SECURITY;

-- Update transactions
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  quantity decimal(20,8) NOT NULL,
  price decimal(20,8) NOT NULL,
  total_amount decimal(20,2) NOT NULL,
  fees decimal(20,2) DEFAULT 0,
  transaction_hash text,
  block_number bigint,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Update user_follows
DROP TABLE IF EXISTS public.user_follows CASCADE;
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id text NOT NULL,
  following_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;