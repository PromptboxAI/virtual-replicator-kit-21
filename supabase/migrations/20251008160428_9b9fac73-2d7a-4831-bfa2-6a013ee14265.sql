-- Add RPC to fetch FX rate as-of a given timestamp
create or replace function get_fx_asof(p_ts timestamptz)
returns table(fx numeric, asof timestamptz)
language sql stable security definer set search_path = public
as $$
  select fx_rate_usd as fx, asof
  from prompt_fx
  where asof <= coalesce(p_ts, now())
  order by asof desc
  limit 1
$$;

grant execute on function get_fx_asof(timestamptz) to anon, authenticated;