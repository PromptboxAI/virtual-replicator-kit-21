-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid()::text, 'admin'));

-- Add test_mode column to user_token_balances table
ALTER TABLE public.user_token_balances 
ADD COLUMN test_mode BOOLEAN DEFAULT true;

-- Add test_mode column to agents table
ALTER TABLE public.agents 
ADD COLUMN test_mode BOOLEAN DEFAULT true;

-- Insert admin role for kevin@promptbox.com
-- Note: This will need the actual user_id from auth.users table
-- For now, we'll create a function to set admin role by email
CREATE OR REPLACE FUNCTION public.set_admin_by_email(_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- This is a placeholder function since we can't directly query auth.users
    -- The actual user_id will need to be set manually after the user signs up
    RAISE NOTICE 'Admin role setup function created for email: %', _email;
END;
$$;