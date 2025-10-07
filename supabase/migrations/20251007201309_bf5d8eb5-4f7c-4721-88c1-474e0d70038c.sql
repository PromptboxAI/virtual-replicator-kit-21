-- Phase A1: Fix get_ohlc_with_fx API shape & ISO timestamps
drop function if exists get_ohlc_with_fx(uuid, text, int);

create or replace function get_ohlc_with_fx(
  p_agent_id uuid,
  p_timeframe text,
  p_limit int default 300
)
returns table (
  t  text,
  o  text,
  h  text,
  l  text,
  c  text,
  v  text,
  fx text
)
language sql
stable
as $$
  select
    to_char(ohlc.bucket_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as t,
    ohlc.open_prompt::text  as o,
    ohlc.high_prompt::text  as h,
    ohlc.low_prompt::text   as l,
    ohlc.close_prompt::text as c,
    ohlc.volume_agent::text as v,
    fx.fx_rate_usd::text    as fx
  from agent_ohlcv ohlc
  left join lateral (
    select fx_rate_usd
    from prompt_fx
    where asof <= ohlc.bucket_time
    order by asof desc
    limit 1
  ) fx on true
  where ohlc.agent_id = p_agent_id
    and ohlc.timeframe = p_timeframe
  order by ohlc.bucket_time asc
  limit p_limit;
$$;

grant execute on function get_ohlc_with_fx(uuid, text, int) to authenticated, anon;

-- Phase A2: Fix agent_metrics_normalized (V3/V4 routing + FX + supply policy)
drop view if exists agent_metrics_normalized cascade;

create view agent_metrics_normalized as
with latest_fx as (
  select
    fx_rate_usd as fx,
    extract(epoch from (now() - asof))::int as fx_staleness_seconds
  from prompt_fx
  order by asof desc
  limit 1
)
select
  a.id as agent_id,
  case
    when a.pricing_model = 'linear_v4' then get_agent_current_price_v4(a.id)
    when a.pricing_model = 'linear_v3' then get_price_from_prompt_v3(a.prompt_raised)
    else a.current_price
  end as price_prompt,
  fx.fx,
  fx.fx as prompt_usd_rate,
  fx.fx_staleness_seconds,
  a.total_supply,
  coalesce(a.circulating_supply, a.bonding_curve_supply, 0) as circulating_supply,
  case
    when (select status from agent_graduation g where g.agent_id=a.id limit 1)='graduated'
      then 'CIRCULATING' else 'FDV'
  end as supply_policy,
  (case when fx.fx is not null then a.total_supply * (
    case
      when a.pricing_model='linear_v4' then get_agent_current_price_v4(a.id)
      when a.pricing_model='linear_v3' then get_price_from_prompt_v3(a.prompt_raised)
      else a.current_price
    end * fx.fx) end) as fdv_usd,
  (case when fx.fx is not null then coalesce(a.circulating_supply, a.bonding_curve_supply, 0) * (
    case
      when a.pricing_model='linear_v4' then get_agent_current_price_v4(a.id)
      when a.pricing_model='linear_v3' then get_price_from_prompt_v3(a.prompt_raised)
      else a.current_price
    end * fx.fx) end) as market_cap_usd,
  (case when fx.fx is not null then a.total_supply * (
    case
      when a.pricing_model='linear_v4' then get_agent_current_price_v4(a.id)
      when a.pricing_model='linear_v3' then get_price_from_prompt_v3(a.prompt_raised)
      else a.current_price
    end * fx.fx) end) as fdv_prompt,
  (case when fx.fx is not null then coalesce(a.circulating_supply, a.bonding_curve_supply, 0) * (
    case
      when a.pricing_model='linear_v4' then get_agent_current_price_v4(a.id)
      when a.pricing_model='linear_v3' then get_price_from_prompt_v3(a.prompt_raised)
      else a.current_price
    end) end) as mcirc_prompt,
  (case when fx.fx is not null then coalesce(a.circulating_supply, a.bonding_curve_supply, 0) * (
    case
      when a.pricing_model='linear_v4' then get_agent_current_price_v4(a.id)
      when a.pricing_model='linear_v3' then get_price_from_prompt_v3(a.prompt_raised)
      else a.current_price
    end * fx.fx) end) as mcirc_usd,
  (case when fx.fx is not null then (
    case
      when a.pricing_model='linear_v4' then get_agent_current_price_v4(a.id)
      when a.pricing_model='linear_v3' then get_price_from_prompt_v3(a.prompt_raised)
      else a.current_price
    end * fx.fx) end) as price_usd,
  a.updated_at
from agents a
cross join latest_fx fx;

grant select on agent_metrics_normalized to authenticated, anon;