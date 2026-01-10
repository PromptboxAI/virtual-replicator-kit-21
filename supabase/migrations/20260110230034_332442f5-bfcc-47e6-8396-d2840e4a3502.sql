-- Create a function to sync circulating_supply for existing agents
CREATE OR REPLACE FUNCTION public.sync_circulating_supply()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE agents
  SET circulating_supply = COALESCE(shares_sold, bonding_curve_supply, 0)
  WHERE circulating_supply IS NULL 
     OR circulating_supply = 0 
     OR circulating_supply != COALESCE(shares_sold, bonding_curve_supply, 0);
END;
$function$;

-- Run it once to fix existing data
SELECT sync_circulating_supply();