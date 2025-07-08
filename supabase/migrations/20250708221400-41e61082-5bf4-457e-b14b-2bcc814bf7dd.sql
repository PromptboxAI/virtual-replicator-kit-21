-- Step 2c: Now change the column types to TEXT
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_agent_holdings ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_follows ALTER COLUMN follower_id TYPE TEXT;
ALTER TABLE public.user_follows ALTER COLUMN following_id TYPE TEXT;