# Bonding Curve V5 Deployment Guide

## Overview
This guide covers deploying the Bonding Curve V5 contracts to Base Sepolia testnet.

## Prerequisites

1. **Deployer Wallet Setup**
   - Set `DEPLOYER_PRIVATE_KEY` in Supabase Edge Function secrets
   - Fund the deployer wallet with Base Sepolia ETH (get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

2. **Required Contract Addresses**
   - PROMPT Token address (deployed ERC20)
   - Platform Vault address (EOA or contract)
   - Treasury address (EOA or contract)

## Step 1: Compile Contracts

The V5 contracts need to be compiled to get their bytecode and ABI. You can use:

### Option A: Hardhat
```bash
npx hardhat compile
```

### Option B: Foundry
```bash
forge build
```

### Option C: Remix IDE
1. Copy contract code to [Remix](https://remix.ethereum.org)
2. Compile with Solidity 0.8.20
3. Download bytecode and ABI

## Step 2: Update Edge Functions

After compilation, update the edge functions with the actual bytecode:

1. **`supabase/functions/deploy-bonding-curve-v5/index.ts`**
   - Replace `BONDING_CURVE_V5_BYTECODE` with compiled bytecode
   - Update `BONDING_CURVE_V5_ABI` with full ABI

2. **`supabase/functions/deploy-agent-factory-v5/index.ts`**
   - Replace `AGENT_FACTORY_V5_BYTECODE` with compiled bytecode
   - Update `AGENT_FACTORY_V5_ABI` with full ABI

## Step 3: Deploy Using UI

1. Navigate to Admin page or deployment component
2. Use the `<BondingCurveV5Deployment />` component
3. Enter required addresses:
   - PROMPT Token Address
   - Platform Vault Address
   - Treasury Address
4. Click "Deploy V5 Contracts"

The deployment will:
1. Deploy BondingCurveV5 contract
2. Automatically deploy AgentFactoryV5 contract
3. Save contract addresses to localStorage
4. Verify deployments in database

## Step 4: Verify Deployment

Check that contracts are deployed:

```sql
-- Check deployment audit
SELECT * FROM deployed_contracts_audit 
WHERE deployment_method IN ('bonding_curve_v5', 'agent_factory_v5')
ORDER BY created_at DESC;
```

Test basic contract reads:
```typescript
// Test getCurrentPrice for a test agent
const price = await bondingCurve.getCurrentPrice(testAgentId);
console.log('Starting price:', price);
```

## Contract Addresses

Once deployed, addresses are stored in:
- `localStorage.BONDING_CURVE_V5_ADDRESS`
- `localStorage.AGENT_FACTORY_V5_ADDRESS`
- Database: `deployed_contracts_audit` table

## Architecture

### BondingCurveV5
- Single contract for all agents
- Linear pricing: p0 = 0.0000075, p1 = 0.00075
- Buy fee: 5% (2% creator, 2% platform, 1% LP)
- Sell fee: 0%
- Graduation at 750,000 PROMPT reserves

### AgentTokenV5
- Simple ERC20 with restricted minting
- Only BondingCurveV5 can mint/burn
- 1B max supply

### AgentFactoryV5
- Deploys AgentTokenV5 instances
- Registers with BondingCurveV5
- Transfers ownership to creator

## Next Steps

After deployment:
1. Test agent creation with factory
2. Test buy/sell transactions
3. Update frontend to use V5 by default
4. Create migration path from V3/V4 to V5

## Troubleshooting

### Deployment Fails
- Check deployer wallet has sufficient ETH
- Verify all addresses are valid
- Check edge function logs for details

### Contract Not Found
- Ensure addresses are saved to localStorage
- Verify contract was deployed on correct chain
- Check `deployed_contracts_audit` table

### Transaction Reverts
- Ensure PROMPT token is approved before buying
- Check slippage settings (default 1%)
- Verify agent is registered before trading

## Production Deployment

For mainnet deployment:
1. Audit all contracts thoroughly
2. Use multi-sig for platform vault and treasury
3. Deploy to Base Mainnet (chainId: 8453)
4. Set up monitoring and alerts
5. Test with small amounts first
