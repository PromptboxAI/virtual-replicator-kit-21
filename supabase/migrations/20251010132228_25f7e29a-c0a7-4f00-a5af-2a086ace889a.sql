-- ============================================================================
-- PHASE 6B: FINAL FIX - Correct V4 Pricing + Supply Sync + Units Documentation
-- ============================================================================
-- 
-- CRITICAL FIXES:
-- 1. get_agent_current_price_v4() now returns TEXT (prevents JS float drift)
-- 2. get_agent_current_price_v4() uses prompt_raised (not bonding_curve_supply)
-- 3. bonding_curve_supply is analytics-only cache (synced via triggers)
-- 4. Schema comments document units explicitly
-- 
-- UNITS REFERENCE:
-- - bonding_curve_supply: Raw token units (not /1e9)
-- - OHLC volume_agent: Raw token units (chart adapter normalizes)
-- - Token decimals: 1e9 (1 display token = 1,000,000,000 raw units)
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop dependent view temporarily
-- ============================================================================
DROP VIEW IF EXISTS agent_metrics_normalized CASCADE;

-- ============================================================================
-- STEP 2: Drop and recreate get_agent_current_price_v4() with TEXT return type
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_agent_current_price_v4(uuid);

CREATE FUNCTION public.get_agent_current_price_v4(p_agent_id uuid)
RETURNS text  -- ✅ Changed from numeric to text (prevents JS float drift)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_prompt_raised NUMERIC;
  v_calculated_supply NUMERIC;
  v_price NUMERIC;
BEGIN
  -- ✅ FIX: Read from prompt_raised (source of truth)
  SELECT prompt_raised INTO v_prompt_raised
  FROM agents 
  WHERE id = p_agent_id;
  
  IF v_prompt_raised IS NULL OR v_prompt_raised <= 0 THEN
    RETURN '0.0000075';  -- Return starting price as string
  END IF;
  
  -- ✅ Use inverse function to get supply from prompt
  v_calculated_supply := tokens_sold_from_prompt_v4(v_prompt_raised);
  
  -- ✅ Use forward function to get price from supply
  v_price := get_current_linear_price_v4(v_calculated_supply);
  
  -- ✅ Return as TEXT to prevent float drift at edge boundary
  RETURN v_price::text;
END;
$function$;

-- ============================================================================
-- STEP 3: Recreate agent_metrics_normalized view with TEXT price handling
-- ============================================================================
CREATE VIEW agent_metrics_normalized AS
SELECT
  a.id as agent_id,
  -- Price in PROMPT (convert TEXT to NUMERIC for calculations)
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric
    ELSE a.current_price
  END as price_prompt,
  -- Price in USD
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(fx.fx_rate_usd, 0.10)
    ELSE a.current_price * COALESCE(fx.fx_rate_usd, 0.10)
  END as price_usd,
  -- FX rate and staleness
  COALESCE(fx.fx_rate_usd, 0.10) as fx,
  COALESCE(fx.fx_rate_usd, 0.10) as prompt_usd_rate,
  EXTRACT(EPOCH FROM (NOW() - fx.asof))::int as fx_staleness_seconds,
  -- Supply
  1000000000 as total_supply,
  CASE 
    WHEN a.token_graduated THEN COALESCE(a.circulating_supply, 0)
    ELSE 1000000000
  END as circulating_supply,
  CASE 
    WHEN a.token_graduated THEN 'circulating'
    ELSE 'total'
  END as supply_policy,
  -- FDV (PROMPT)
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000
    ELSE a.current_price * 1000000000
  END as fdv_prompt,
  -- FDV (USD)
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
    ELSE a.current_price * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
  END as fdv_usd,
  -- Market Cap (PROMPT)
  CASE 
    WHEN a.token_graduated THEN
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0)
      END
    ELSE
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000
        ELSE a.current_price * 1000000000
      END
  END as mcirc_prompt,
  -- Market Cap (USD)
  CASE 
    WHEN a.token_graduated THEN
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
      END
    ELSE
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
      END
  END as mcirc_usd,
  -- Alias for market_cap_usd (backwards compat)
  CASE 
    WHEN a.token_graduated THEN
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
      END
    ELSE
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
      END
  END as market_cap_usd,
  a.updated_at
FROM agents a
CROSS JOIN LATERAL (
  SELECT fx_rate_usd, asof
  FROM prompt_fx
  ORDER BY asof DESC
  LIMIT 1
) fx
WHERE a.is_active = true;

-- ============================================================================
-- STEP 4: Create helper function to calculate current supply from trades
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_curve_supply_now(p_agent_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
AS $function$
  SELECT COALESCE(
    (SELECT SUM(token_amount) FROM agent_token_buy_trades WHERE agent_id = p_agent_id),
    0
  ) - COALESCE(
    (SELECT SUM(token_amount) FROM agent_token_sell_trades WHERE agent_id = p_agent_id),
    0
  );
$function$;

-- ============================================================================
-- STEP 5: Backfill bonding_curve_supply for all V4 agents
-- ============================================================================
UPDATE agents
SET bonding_curve_supply = get_curve_supply_now(id)
WHERE pricing_model = 'linear_v4';

-- ============================================================================
-- STEP 6: Create trigger function to sync bonding_curve_supply
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_agent_curve_supply()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update bonding_curve_supply for the affected agent
  UPDATE agents
  SET bonding_curve_supply = get_curve_supply_now(
    COALESCE(NEW.agent_id, OLD.agent_id)
  )
  WHERE id = COALESCE(NEW.agent_id, OLD.agent_id)
    AND pricing_model = 'linear_v4';
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ============================================================================
-- STEP 7: Attach triggers to buy/sell tables (AFTER, row-level)
-- ============================================================================
DROP TRIGGER IF EXISTS sync_supply_on_buy ON agent_token_buy_trades;
CREATE TRIGGER sync_supply_on_buy
  AFTER INSERT OR UPDATE OR DELETE ON agent_token_buy_trades
  FOR EACH ROW
  EXECUTE FUNCTION sync_agent_curve_supply();

DROP TRIGGER IF EXISTS sync_supply_on_sell ON agent_token_sell_trades;
CREATE TRIGGER sync_supply_on_sell
  AFTER INSERT OR UPDATE OR DELETE ON agent_token_sell_trades
  FOR EACH ROW
  EXECUTE FUNCTION sync_agent_curve_supply();

-- ============================================================================
-- STEP 8: Add schema comments documenting units explicitly
-- ============================================================================
COMMENT ON COLUMN agents.bonding_curve_supply IS 
'Analytics cache only. Raw token units (not normalized by 1e9). 
NEVER use for pricing - use get_agent_current_price_v4() or prompt_raised instead.
Synced automatically via triggers on buy/sell tables.';

COMMENT ON COLUMN agent_ohlcv.volume_agent IS
'Raw token units (not normalized by 1e9). Chart adapter normalizes for display.';

COMMENT ON COLUMN agent_token_buy_trades.token_amount IS
'Raw token units (not normalized by 1e9). Use decimals=9 for display conversion.';

COMMENT ON COLUMN agent_token_sell_trades.token_amount IS
'Raw token units (not normalized by 1e9). Use decimals=9 for display conversion.';