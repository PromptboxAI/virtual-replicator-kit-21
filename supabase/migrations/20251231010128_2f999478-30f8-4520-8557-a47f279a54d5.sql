
-- Add V6.1 pricing support to database functions
-- This fixes the pricing error for linear_v6_1 agents

-- ============================================
-- V6.1 CONSTANTS
-- ============================================
-- DEFAULT_P0: 0.00004 PROMPT per token
-- DEFAULT_P1: 0.00024 PROMPT per token  
-- DATABASE_TRADEABLE_CAP: 300,000,000 tokens
-- GRADUATION_THRESHOLD_PROMPT: 42,000 PROMPT

-- ============================================
-- GET CURRENT PRICE FOR V6.1
-- Uses shares_sold directly from agents table
-- ============================================
CREATE OR REPLACE FUNCTION get_current_linear_price_v6_1(
  p_shares_sold NUMERIC,
  p_p0 NUMERIC DEFAULT 0.00004,
  p_p1 NUMERIC DEFAULT 0.00024
)
RETURNS NUMERIC AS $$
DECLARE
  v_tradeable_cap NUMERIC := 300000000;
  v_slope NUMERIC;
BEGIN
  v_slope := (p_p1 - p_p0) / v_tradeable_cap;
  RETURN p_p0 + v_slope * COALESCE(p_shares_sold, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- GET AGENT CURRENT PRICE V6.1
-- Reads from shares_sold and created_p0/p1
-- ============================================
CREATE OR REPLACE FUNCTION get_agent_current_price_v6_1(p_agent_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_shares_sold NUMERIC;
  v_p0 NUMERIC;
  v_p1 NUMERIC;
BEGIN
  SELECT shares_sold, created_p0, created_p1 
  INTO v_shares_sold, v_p0, v_p1
  FROM agents 
  WHERE id = p_agent_id;
  
  -- Use defaults if not set
  v_p0 := COALESCE(v_p0, 0.00004);
  v_p1 := COALESCE(v_p1, 0.00024);
  v_shares_sold := COALESCE(v_shares_sold, 0);
  
  RETURN get_current_linear_price_v6_1(v_shares_sold, v_p0, v_p1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- UPDATE TRIGGER TO HANDLE V6.1
-- ============================================
CREATE OR REPLACE FUNCTION update_agent_price_on_prompt_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pricing_model = 'linear_v6_1' THEN
    -- V6.1: Use shares_sold with custom p0/p1
    NEW.current_price := get_current_linear_price_v6_1(
      COALESCE(NEW.shares_sold, 0),
      COALESCE(NEW.created_p0, 0.00004),
      COALESCE(NEW.created_p1, 0.00024)
    );
    NEW.market_cap := NEW.current_price * 1000000000; -- 1B total supply
  ELSIF NEW.pricing_model = 'linear_v4' THEN
    -- Use V4 linear pricing
    NEW.current_price := get_price_from_prompt_v4(NEW.prompt_raised);
    NEW.market_cap := NEW.current_price * 1000000000;
  ELSIF NEW.pricing_model = 'linear_v3' THEN
    -- Use V3 linear pricing
    NEW.current_price := get_price_from_prompt_v3(NEW.prompt_raised);
    NEW.market_cap := NEW.current_price * 1000000000;
  ELSE
    -- Legacy AMM pricing for older agents
    NEW.current_price := get_current_bonding_curve_price(
      CASE 
        WHEN NEW.prompt_raised <= 0 THEN 0
        ELSE NEW.prompt_raised * 0.1
      END
    );
    NEW.market_cap := NEW.current_price * 1000000000;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX EXISTING V6.1 AGENTS
-- ============================================
UPDATE agents
SET current_price = get_current_linear_price_v6_1(
  COALESCE(shares_sold, 0),
  COALESCE(created_p0, 0.00004),
  COALESCE(created_p1, 0.00024)
),
market_cap = get_current_linear_price_v6_1(
  COALESCE(shares_sold, 0),
  COALESCE(created_p0, 0.00004),
  COALESCE(created_p1, 0.00024)
) * 1000000000
WHERE pricing_model = 'linear_v6_1';
