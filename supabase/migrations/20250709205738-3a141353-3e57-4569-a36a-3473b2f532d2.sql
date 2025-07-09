-- Add Twitter connection data to profiles table
ALTER TABLE public.profiles 
ADD COLUMN twitter_id text,
ADD COLUMN twitter_username text,
ADD COLUMN twitter_display_name text,
ADD COLUMN twitter_avatar_url text,
ADD COLUMN twitter_access_token text,
ADD COLUMN twitter_access_token_secret text;