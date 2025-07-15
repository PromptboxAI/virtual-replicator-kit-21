-- Add authentication method tracking to profiles table
ALTER TABLE public.profiles ADD COLUMN auth_method TEXT DEFAULT 'email';

-- Add constraint to ensure valid auth methods
ALTER TABLE public.profiles ADD CONSTRAINT check_auth_method 
CHECK (auth_method IN ('email', 'wallet'));

-- Update existing profiles to have the email auth method as default
UPDATE public.profiles SET auth_method = 'email' WHERE auth_method IS NULL;

-- Make auth_method not null after setting defaults
ALTER TABLE public.profiles ALTER COLUMN auth_method SET NOT NULL;