-- Enable replica identity for tables that might not have it
ALTER TABLE public.agent_token_buy_trades REPLICA IDENTITY FULL;
ALTER TABLE public.agent_token_sell_trades REPLICA IDENTITY FULL;
ALTER TABLE public.agent_token_holders REPLICA IDENTITY FULL;
ALTER TABLE public.user_token_balances REPLICA IDENTITY FULL;