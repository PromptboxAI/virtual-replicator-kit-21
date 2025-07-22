-- Enable real-time for the tables we're subscribing to
ALTER TABLE public.agents REPLICA IDENTITY FULL;
ALTER TABLE public.agent_token_buy_trades REPLICA IDENTITY FULL;
ALTER TABLE public.agent_token_sell_trades REPLICA IDENTITY FULL;
ALTER TABLE public.agent_token_holders REPLICA IDENTITY FULL;
ALTER TABLE public.user_token_balances REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_token_buy_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_token_sell_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_token_holders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_token_balances;