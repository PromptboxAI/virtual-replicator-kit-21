-- Enable realtime for agents table - Phase 3 implementation
ALTER TABLE public.agents REPLICA IDENTITY FULL;

-- Add agents table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;