-- Add terms_accepted_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN terms_accepted_at timestamp with time zone;