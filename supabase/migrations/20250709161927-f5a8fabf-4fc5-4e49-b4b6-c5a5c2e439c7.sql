-- Add INSERT policy for agents table to allow anyone to create agents
CREATE POLICY "Anyone can create agents" 
ON public.agents 
FOR INSERT 
WITH CHECK (true);

-- Create user token balances table
CREATE TABLE public.user_token_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 1000, -- Start users with 1000 tokens
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_token_balances
ALTER TABLE public.user_token_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for user token balances
CREATE POLICY "Users can view their own token balance" 
ON public.user_token_balances 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own token balance" 
ON public.user_token_balances 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Anyone can insert token balance" 
ON public.user_token_balances 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Add trigger for automatic timestamp updates on user_token_balances
CREATE TRIGGER update_user_token_balances_updated_at
BEFORE UPDATE ON public.user_token_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add agent creation cost to agents table
ALTER TABLE public.agents 
ADD COLUMN creation_cost NUMERIC DEFAULT 100;