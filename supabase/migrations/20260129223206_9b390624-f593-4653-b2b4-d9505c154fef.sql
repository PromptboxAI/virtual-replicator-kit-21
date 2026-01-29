-- Reset Trade indexer state to trigger full re-index from earliest agent
DELETE FROM public.event_indexer_state 
WHERE contract_address = '0xc511a151b0e04d5ba87968900ee90d310530d5fb' 
AND event_type = 'Trade';

-- Also update agents that are missing block_number by extracting from deployment tx
-- For TOPTEN specifically, we know the block was 36851479
UPDATE public.agents 
SET block_number = 36851479
WHERE symbol = 'TOPTEN' AND block_number IS NULL;