-- Add security definer and search_path to get_liquidity_summary
drop function if exists public.get_liquidity_summary(uuid);

create or replace function public.get_liquidity_summary(p_agent_id uuid)
returns table (
  agent_id uuid,
  creation_mode text,
  graduation_mode text,
  status text,
  lp_percent text,
  source text,
  lp_prompt text,
  lp_usd text,
  lp_pair_symbol text,
  lp_pair_amount text,
  asof text,
  fx text
)
language sql stable
security definer
set search_path = public
as $$
with A as (
  select
    a.id,
    a.creation_mode,
    a.graduation_mode,
    a.prompt_raised,
    coalesce((select lp_prompt_allocation_percent from get_bonding_curve_config_v4()), 70) as lp_pct,
    case
      when coalesce(a.token_graduated, false) then 'post_grad'
      else 'pre_grad'
    end as status
  from agents a
  where a.id = p_agent_id
),
G as (
  select
    e.agent_id,
    e.created_at,
    e.metadata->>'lp_prompt' as lp_prompt_str,
    e.metadata->>'lp_pair_symbol' as lp_pair_symbol,
    e.metadata->>'lp_pair_amount' as lp_pair_amount_str,
    coalesce((e.metadata->>'asof')::timestamptz, e.created_at) as asof
  from agent_graduation_events e
  where e.agent_id = p_agent_id
  order by e.created_at desc
  limit 1
),
CHOICE as (
  select
    A.id as agent_id,
    A.creation_mode,
    A.graduation_mode,
    A.status,
    A.lp_pct,
    A.prompt_raised,
    case
      when A.status = 'post_grad'
       and A.graduation_mode = 'smart_contract'
       and nullif(G.lp_prompt_str,'') is not null
       and G.lp_pair_symbol is not null
       and nullif(G.lp_pair_amount_str,'') is not null
      then 'actual' else 'projected'
    end as source,
    case
      when A.status = 'post_grad'
       and A.graduation_mode = 'smart_contract'
       and nullif(G.lp_prompt_str,'') is not null
       and G.lp_pair_symbol is not null
       and nullif(G.lp_pair_amount_str,'') is not null
      then (G.lp_prompt_str)::numeric
      else (A.prompt_raised * (A.lp_pct/100.0))
    end as lp_prompt_num,
    case
      when A.status = 'post_grad'
       and A.graduation_mode = 'smart_contract'
       and nullif(G.lp_prompt_str,'') is not null
       and G.lp_pair_symbol is not null
       and nullif(G.lp_pair_amount_str,'') is not null
      then G.lp_pair_symbol else null end as lp_pair_symbol,
    case
      when A.status = 'post_grad'
       and A.graduation_mode = 'smart_contract'
       and nullif(G.lp_prompt_str,'') is not null
       and G.lp_pair_symbol is not null
       and nullif(G.lp_pair_amount_str,'') is not null
       and nullif(G.lp_pair_amount_str,'') is not null
      then (G.lp_pair_amount_str)::numeric else null end as lp_pair_amount_num,
    case
      when A.status = 'post_grad'
       and A.graduation_mode = 'smart_contract'
       and nullif(G.lp_prompt_str,'') is not null
       and G.lp_pair_symbol is not null
       and nullif(G.lp_pair_amount_str,'') is not null
      then G.asof else now()
    end as asof_ts
  from A
  left join G on true
),
FX as (
  select c.*,
    coalesce(
      (select fx from get_fx_asof(c.asof_ts)),
      (select fx from get_fx_asof(now()))
    ) as fx_rate
  from CHOICE c
)
select
  agent_id,
  creation_mode,
  graduation_mode,
  status,
  lp_pct::text as lp_percent,
  source,
  lp_prompt_num::text as lp_prompt,
  (lp_prompt_num * coalesce(fx_rate, 0.10))::text as lp_usd,
  lp_pair_symbol,
  lp_pair_amount_num::text as lp_pair_amount,
  to_char(asof_ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as asof,
  coalesce(fx_rate, 0.10)::text as fx
from FX;
$$;

-- Tighten grants
revoke all on function public.get_liquidity_summary(uuid) from public;
grant execute on function public.get_liquidity_summary(uuid) to anon, authenticated;

-- Add performance indexes
create index if not exists idx_age_agent_id_created_desc
  on agent_graduation_events(agent_id, created_at desc);

create index if not exists idx_prompt_fx_asof 
  on prompt_fx(asof);