-- Add ENS and wallet mapping fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN ens_name TEXT,
ADD COLUMN resolved_wallet TEXT,
ADD COLUMN wallet_last_updated TIMESTAMP WITH TIME ZONE;

-- Add creator wallet mapping to agents table for direct reference
ALTER TABLE public.agents
ADD COLUMN creator_wallet_address TEXT,
ADD COLUMN creator_ens_name TEXT;

-- Create index for ENS name lookups
CREATE INDEX idx_profiles_ens_name ON public.profiles(ens_name) WHERE ens_name IS NOT NULL;
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_profiles_resolved_wallet ON public.profiles(resolved_wallet) WHERE resolved_wallet IS NOT NULL;

-- Create index for agent creator wallet lookups
CREATE INDEX idx_agents_creator_wallet ON public.agents(creator_wallet_address) WHERE creator_wallet_address IS NOT NULL;

-- Create a function to update wallet timestamp when wallet fields change
CREATE OR REPLACE FUNCTION public.update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.wallet_address IS DISTINCT FROM NEW.wallet_address) OR 
     (OLD.ens_name IS DISTINCT FROM NEW.ens_name) OR 
     (OLD.resolved_wallet IS DISTINCT FROM NEW.resolved_wallet) THEN
    NEW.wallet_last_updated = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update wallet timestamp
CREATE TRIGGER update_profiles_wallet_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_timestamp();