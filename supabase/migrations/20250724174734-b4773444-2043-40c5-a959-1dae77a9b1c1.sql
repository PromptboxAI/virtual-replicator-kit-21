-- Phase 1: Fix all existing agent prices to match bonding curve calculations
-- This will update all agents to have correct dynamic prices

UPDATE public.agents 
SET current_price = get_current_bonding_curve_price(
  CASE 
    WHEN prompt_raised <= 0 THEN 0
    ELSE prompt_raised * 0.1  -- Convert PROMPT to tokens approximation
  END
),
updated_at = now()
WHERE current_price != get_current_bonding_curve_price(
  CASE 
    WHEN prompt_raised <= 0 THEN 0
    ELSE prompt_raised * 0.1
  END
);

-- Phase 2: Create trigger to auto-update prices when prompt_raised changes
CREATE OR REPLACE FUNCTION public.update_agent_price_on_prompt_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically update current_price based on bonding curve when prompt_raised changes
  NEW.current_price = get_current_bonding_curve_price(
    CASE 
      WHEN NEW.prompt_raised <= 0 THEN 0
      ELSE NEW.prompt_raised * 0.1
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic price updates
DROP TRIGGER IF EXISTS trigger_update_agent_price ON public.agents;
CREATE TRIGGER trigger_update_agent_price
  BEFORE UPDATE OF prompt_raised ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_price_on_prompt_change();

-- Also create trigger for INSERT to ensure new agents get correct initial prices
DROP TRIGGER IF EXISTS trigger_set_agent_initial_price ON public.agents;
CREATE TRIGGER trigger_set_agent_initial_price
  BEFORE INSERT ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_price_on_prompt_change();