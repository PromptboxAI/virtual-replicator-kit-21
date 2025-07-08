-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text UNIQUE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  total_portfolio_value decimal(20,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agents table for AI agent metadata
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  symbol text NOT NULL UNIQUE,
  description text,
  category text,
  avatar_url text,
  website_url text,
  twitter_url text,
  current_price decimal(20,8) NOT NULL DEFAULT 0,
  market_cap decimal(20,2) DEFAULT 0,
  volume_24h decimal(20,2) DEFAULT 0,
  price_change_24h decimal(10,4) DEFAULT 0,
  total_supply bigint DEFAULT 0,
  circulating_supply bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user agent holdings table
CREATE TABLE public.user_agent_holdings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create transactions table for trading history
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create agent price history table
CREATE TABLE public.agent_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  price decimal(20,8) NOT NULL,
  volume decimal(20,2) DEFAULT 0,
  market_cap decimal(20,2) DEFAULT 0,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Create follows table for social features
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agent_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for agents (publicly readable, admin writable)
CREATE POLICY "Agents are viewable by everyone" 
ON public.agents FOR SELECT USING (true);

-- Create RLS policies for user holdings
CREATE POLICY "Users can view their own holdings" 
ON public.user_agent_holdings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" 
ON public.user_agent_holdings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings" 
ON public.user_agent_holdings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for price history (publicly readable)
CREATE POLICY "Price history is viewable by everyone" 
ON public.agent_price_history FOR SELECT USING (true);

-- Create RLS policies for follows
CREATE POLICY "Users can view all follows" 
ON public.user_follows FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" 
ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_agent_holdings_updated_at
BEFORE UPDATE ON public.user_agent_holdings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX idx_user_agent_holdings_user_id ON public.user_agent_holdings(user_id);
CREATE INDEX idx_user_agent_holdings_agent_id ON public.user_agent_holdings(agent_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_agent_id ON public.transactions(agent_id);
CREATE INDEX idx_agent_price_history_agent_id ON public.agent_price_history(agent_id);
CREATE INDEX idx_agent_price_history_timestamp ON public.agent_price_history(timestamp);
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);

-- Insert sample agents data
INSERT INTO public.agents (name, symbol, description, category, current_price, market_cap, volume_24h, price_change_24h) VALUES
('aixbt', 'AIXBT', 'Provides market alpha', 'Autonomous Onchain Commerce', 126.43, 15670000, 2100000, -1.95),
('Luna', 'LUNA', 'Advanced trading algorithms', 'Trading', 89.52, 8950000, 2100000, 8.23),
('Zerebro', 'ZERO', 'Deep market analytics', 'Analytics', 156.78, 18900000, 5800000, -3.45),
('Aelred', 'AEL', 'DeFi optimization protocol', 'DeFi', 203.91, 25600000, 3200000, 12.67),
('Degenixi', 'DEGEN', 'Gaming ecosystem agent', 'Gaming', 78.34, 6780000, 1900000, -5.12),
('Athena', 'ATH', 'Research and analysis', 'Research', 134.67, 16780000, 4100000, 7.89),
('Gigabrain', 'GIGA', 'Multi-purpose AI assistant', 'AI Assistant', 92.15, 11200000, 2700000, 15.23);