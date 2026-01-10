# V7 Deprecated Edge Functions

These edge functions are deprecated as of V8 implementation (January 2026).

## Reason for Deprecation

V8 introduces fully on-chain trading via the `BondingCurveV8` contract, replacing the database-mode trading of V7.

## Deprecated Functions

The following functions are no longer used for new V8 agents but remain functional for legacy V7 agents:

### Trading Functions
- `trading-engine-v7/` - Replaced by on-chain trading via BondingCurveV8
- `execute-trade/` - No longer needed; users sign transactions directly
- `execute-bonding-curve-trade-v4/` - Obsolete

### Deployment Functions
- `deploy-bonding-curve-v5/` - Replaced by AgentFactoryV8
- `deploy-agent-factory-v5/` - Replaced by AgentFactoryV8

### Graduation Functions
- `graduation-manager-v6/` - Replaced by graduation-orchestrator-v8
- `graduation-manager-v7/` - Replaced by graduation-orchestrator-v8

## Migration Path

For V8 agents:
1. Trading: Users interact with BondingCurveV8 contract directly
2. Quotes: Use `get-quote-v8` edge function
3. Graduation: Use `graduation-orchestrator-v8` edge function
4. Trade sync: Use `sync-on-chain-trades` edge function
5. Event indexing: Use `index-prototype-events` edge function

## DO NOT DELETE

Keep these functions for:
1. Legacy V7 agent support
2. Reference implementation
3. Potential rollback scenarios

## V8 Contract Addresses

```
BONDING_CURVE_V8 = 0xc511a151b0E04D5Ba87968900eE90d310530D5fB
AGENT_FACTORY_V8 = 0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79
GRADUATION_MANAGER_V8 = 0x3c6878857FB1d1a1155b016A4b904c479395B2D9
TRADING_ROUTER_V8 = 0xce81D37B4f2855Ce1081D172dF7013b8beAE79B0
```

## Reused V7 Contracts

These V7 contracts are REUSED in V8 (not deprecated):
- LP_LOCKER = 0xB8028c5Bf3Eb648279740A1B41387d7a854D48B2
- TEAM_MILESTONE_VESTING = 0xB204ce88f4a18a62b3D02C2598605a6c55186E05
- TEAM_TIME_VESTING = 0xf0C530f3308714Aa28B8199EB7f41B6CD8386f29
- ECOSYSTEM_REWARDS = 0xce11297AD83e1A6cF3635226a2348B8Ed7a6C925
