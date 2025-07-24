-- Phase 4: Add computed price field and improve schema
-- Create a view that always returns the correct dynamic price
CREATE OR REPLACE VIEW public.agent_prices AS
SELECT 
  a.id,
  a.name,
  a.symbol,
  a.prompt_raised,
  a.current_price as static_price,
  get_current_bonding_curve_price(
    CASE 
      WHEN a.prompt_raised <= 0 THEN 0
      ELSE a.prompt_raised * 0.1
    END
  ) as dynamic_price,
  a.token_holders,
  a.market_cap,
  a.volume_24h,
  a.is_active,
  a.test_mode,
  a.token_graduated
FROM public.agents a;

-- Create function to ensure price consistency checks
CREATE OR REPLACE FUNCTION public.check_price_consistency()
RETURNS TABLE(
  agent_id uuid,
  agent_name text,
  static_price numeric,
  dynamic_price numeric,
  difference_percent numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.current_price,
    get_current_bonding_curve_price(
      CASE 
        WHEN a.prompt_raised <= 0 THEN 0
        ELSE a.prompt_raised * 0.1
      END
    ) as calc_price,
    CASE 
      WHEN get_current_bonding_curve_price(
        CASE 
          WHEN a.prompt_raised <= 0 THEN 0
          ELSE a.prompt_raised * 0.1
        END
      ) > 0 THEN
        ABS((a.current_price - get_current_bonding_curve_price(
          CASE 
            WHEN a.prompt_raised <= 0 THEN 0
            ELSE a.prompt_raised * 0.1
          END
        )) / get_current_bonding_curve_price(
          CASE 
            WHEN a.prompt_raised <= 0 THEN 0
            ELSE a.prompt_raised * 0.1
          END
        )) * 100
      ELSE 0
    END as diff_percent
  FROM public.agents a
  WHERE a.is_active = true;
END;
$$;