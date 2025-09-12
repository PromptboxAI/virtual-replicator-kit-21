-- PHASE 1.4: Clean Bad Test Data for ALPHA 2
-- Reset ALPHA2 agent to clean state
UPDATE agents 
SET 
  prompt_raised = 0,
  current_price = 0.000001,
  market_cap = 1000, -- 0.000001 * 1,000,000,000
  token_holders = 0,
  pricing_model = 'linear_v3'
WHERE id = '1d43a77d-44a0-48da-8f5a-1bea56bc8eff';

-- Remove any invalid buy trades for ALPHA2 
DELETE FROM agent_token_buy_trades 
WHERE agent_id = '1d43a77d-44a0-48da-8f5a-1bea56bc8eff'
AND prompt_amount = 1;

-- Remove any holder records for ALPHA2
DELETE FROM agent_token_holders 
WHERE agent_id = '1d43a77d-44a0-48da-8f5a-1bea56bc8eff';