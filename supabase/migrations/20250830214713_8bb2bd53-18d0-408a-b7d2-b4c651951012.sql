-- Fix variable naming collision in calculate_tokens_from_prompt (A vs a)
CREATE OR REPLACE FUNCTION public.calculate_tokens_from_prompt(
  current_tokens_sold numeric,
  prompt_amount numeric
)
RETURNS TABLE(
  token_amount numeric,
  new_tokens_sold numeric,
  new_price numeric,
  average_price numeric
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cfg RECORD;
  slope_m NUMERIC;
  s0 NUMERIC := GREATEST(current_tokens_sold, 0);
  amt NUMERIC := GREATEST(prompt_amount, 0);
  qa NUMERIC;  -- quadratic a = 0.5*m
  qb NUMERIC;  -- quadratic b = p0 + m*s0
  qc NUMERIC;  -- quadratic c = -amt
  disc NUMERIC;
  x NUMERIC;
BEGIN
  SELECT * INTO cfg FROM public.get_bonding_curve_config_v3();

  IF amt <= 0 THEN
    token_amount := 0;
    new_tokens_sold := s0;
    new_price := public.get_current_bonding_curve_price(s0);
    average_price := new_price;
    RETURN NEXT;
    RETURN;
  END IF;

  IF cfg.curve_supply IS NULL OR cfg.curve_supply = 0 THEN
    -- Degenerate: constant price p0
    x := amt / NULLIF(cfg.p0, 0);
  ELSE
    slope_m := (cfg.p1 - cfg.p0) / cfg.curve_supply;
    IF slope_m = 0 THEN
      x := amt / NULLIF(cfg.p0, 0);
    ELSE
      qa := 0.5 * slope_m;
      qb := (cfg.p0 + slope_m * s0);
      qc := -amt;
      disc := qb*qb - 4*qa*qc;
      IF disc < 0 THEN
        x := 0; -- numerical guard
      ELSE
        x := (-qb + sqrt(disc)) / (2*qa);
      END IF;
    END IF;
  END IF;

  token_amount := GREATEST(x, 0);
  new_tokens_sold := s0 + token_amount;
  new_price := public.get_current_bonding_curve_price(new_tokens_sold);
  average_price := CASE WHEN token_amount > 0 THEN amt / token_amount ELSE new_price END;

  RETURN NEXT;
END;
$$;