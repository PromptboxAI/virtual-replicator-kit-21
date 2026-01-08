-- Add dev_ownership_pct column to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS dev_ownership_pct numeric DEFAULT 0;

-- Create function to update creator holdings on buy trades
CREATE OR REPLACE FUNCTION public.update_creator_holdings_on_buy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_creator_wallet text;
  total_creator_prompt numeric;
  creator_token_balance numeric;
  agent_circulating_supply bigint;
BEGIN
  -- Get the agent's creator wallet address
  SELECT creator_wallet_address, circulating_supply 
  INTO agent_creator_wallet, agent_circulating_supply
  FROM agents 
  WHERE id = NEW.agent_id;

  -- Check if the buyer is the creator (case-insensitive comparison)
  IF LOWER(NEW.user_id) = LOWER(agent_creator_wallet) THEN
    -- Calculate total PROMPT spent by creator on this agent
    SELECT COALESCE(SUM(prompt_amount), 0) INTO total_creator_prompt
    FROM agent_token_buy_trades
    WHERE agent_id = NEW.agent_id 
      AND LOWER(user_id) = LOWER(agent_creator_wallet);

    -- Get creator's current token balance
    SELECT COALESCE(token_balance, 0) INTO creator_token_balance
    FROM agent_token_holders
    WHERE agent_id = NEW.agent_id 
      AND LOWER(user_id) = LOWER(agent_creator_wallet);

    -- Calculate ownership percentage (handle division by zero)
    -- Update both creator_prebuy_amount and dev_ownership_pct
    UPDATE agents
    SET 
      creator_prebuy_amount = total_creator_prompt,
      dev_ownership_pct = CASE 
        WHEN circulating_supply > 0 THEN (creator_token_balance / circulating_supply::numeric) * 100
        ELSE 0
      END,
      updated_at = now()
    WHERE id = NEW.agent_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on agent_token_buy_trades
DROP TRIGGER IF EXISTS trigger_update_creator_holdings ON public.agent_token_buy_trades;

CREATE TRIGGER trigger_update_creator_holdings
AFTER INSERT ON public.agent_token_buy_trades
FOR EACH ROW
EXECUTE FUNCTION public.update_creator_holdings_on_buy();

-- Also create a function to recalculate on holder balance changes
CREATE OR REPLACE FUNCTION public.update_dev_ownership_on_holder_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_creator_wallet text;
BEGIN
  -- Get the agent's creator wallet address
  SELECT creator_wallet_address INTO agent_creator_wallet
  FROM agents 
  WHERE id = NEW.agent_id;

  -- Check if this holder is the creator
  IF LOWER(NEW.user_id) = LOWER(agent_creator_wallet) THEN
    -- Update dev_ownership_pct
    UPDATE agents
    SET 
      dev_ownership_pct = CASE 
        WHEN circulating_supply > 0 THEN (NEW.token_balance / circulating_supply::numeric) * 100
        ELSE 0
      END,
      updated_at = now()
    WHERE id = NEW.agent_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on agent_token_holders for updates
DROP TRIGGER IF EXISTS trigger_update_dev_ownership ON public.agent_token_holders;

CREATE TRIGGER trigger_update_dev_ownership
AFTER INSERT OR UPDATE ON public.agent_token_holders
FOR EACH ROW
EXECUTE FUNCTION public.update_dev_ownership_on_holder_change();

-- Fix existing agents: Update creator_prebuy_amount and dev_ownership_pct
UPDATE agents a
SET 
  creator_prebuy_amount = COALESCE(buy_totals.total_prompt, 0),
  dev_ownership_pct = CASE 
    WHEN a.circulating_supply > 0 THEN COALESCE((holder_balance.token_balance / a.circulating_supply::numeric) * 100, 0)
    ELSE 0
  END
FROM (
  SELECT agent_id, user_id, SUM(prompt_amount) as total_prompt
  FROM agent_token_buy_trades
  GROUP BY agent_id, user_id
) buy_totals
LEFT JOIN agent_token_holders holder_balance 
  ON buy_totals.agent_id = holder_balance.agent_id 
  AND LOWER(buy_totals.user_id) = LOWER(holder_balance.user_id)
WHERE a.id = buy_totals.agent_id
  AND LOWER(a.creator_wallet_address) = LOWER(buy_totals.user_id);