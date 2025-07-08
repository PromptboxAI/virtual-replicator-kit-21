-- Step 3: Recreate profiles table with correct structure for Privy

-- First, backup any existing data and drop the table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with TEXT user_id for Privy DIDs
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  wallet_address text UNIQUE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  total_portfolio_value decimal(20,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using a custom function to get current user ID from Privy
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
  -- This will be set by your application when making requests
  SELECT current_setting('request.jwt.claims', true)::json->>'sub';
$$ LANGUAGE SQL STABLE;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (user_id = public.get_current_user_id());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (user_id = public.get_current_user_id());

-- Recreate trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();