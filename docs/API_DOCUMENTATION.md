# API Documentation

## Overview

Promptbox Public API provides REST endpoints for accessing token data, trading information, and market metrics.

**Base URL**: `https://your-project.supabase.co/functions/v1`

**API Version**: `v1`

## Authentication

Most endpoints are public and do not require authentication. Rate limits apply to all requests.

**Rate Limits**:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Endpoints

### Health Check

Check API status and system mode.

```
GET /healthz
```

**Response**:
```json
{
  "status": "ok",
  "mode": "mainnet",
  "apiVersion": "v1",
  "timestamp": "2024-01-15T12:00:00Z",
  "features": {
    "trading": true,
    "graduation": true
  }
}
```

**Modes**:
- `mock` - Mock data for testing
- `sepolia` - Sepolia testnet
- `mainnet` - Base mainnet (production)

---

### List Tokens

Get paginated list of all agent tokens.

```
GET /list-tokens
```

**Query Parameters**:
- `limit` (integer, optional): Number of results (default: 50, max: 100)
- `offset` (integer, optional): Pagination offset (default: 0)
- `sortBy` (string, optional): Sort field (`volume`, `marketCap`, `created`, default: `created`)
- `order` (string, optional): Sort order (`asc`, `desc`, default: `desc`)
- `graduated` (boolean, optional): Filter by graduation status

**Response**:
```json
{
  "tokens": [
    {
      "id": "agent-uuid",
      "name": "Trading Bot Alpha",
      "symbol": "TBA",
      "tokenAddress": "0x...",
      "currentPrice": 0.000152,
      "marketCap": 45632.12,
      "volume24h": 12450.50,
      "priceChange24h": 15.42,
      "holders": 234,
      "promptRaised": 35000.00,
      "graduated": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 156,
  "limit": 50,
  "offset": 0
}
```

---

### Get Token Metadata

Get detailed information about a specific token.

```
GET /get-token-metadata/:agentId
```

**Path Parameters**:
- `agentId` (string, required): Agent UUID or token address

**Response**:
```json
{
  "id": "agent-uuid",
  "name": "Trading Bot Alpha",
  "symbol": "TBA",
  "description": "Automated trading bot for DeFi protocols",
  "tokenAddress": "0x...",
  "creatorAddress": "0x...",
  "avatarUrl": "https://...",
  "websiteUrl": "https://...",
  "twitterUrl": "https://twitter.com/...",
  "pricing": {
    "currentPrice": 0.000152,
    "currentPriceUSD": 0.0234,
    "marketCap": 45632.12,
    "marketCapUSD": 701234.56,
    "fdv": 152000.00,
    "fdvUSD": 2340000.00
  },
  "metrics": {
    "volume24h": 12450.50,
    "priceChange24h": 15.42,
    "holders": 234,
    "totalSupply": 1000000000,
    "circulatingSupply": 300000000
  },
  "graduation": {
    "graduated": false,
    "promptRaised": 35000.00,
    "threshold": 50000.00,
    "progress": 70.00,
    "liquidityPoolAddress": null
  },
  "bondingCurve": {
    "p0": 0.0001,
    "p1": 0.000000001,
    "tokensSold": 300000000
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "deployedAt": "2024-01-15T10:05:32Z"
}
```

---

### Get OHLC Data

Get historical price data in OHLC (Open, High, Low, Close) format.

```
GET /get-ohlc/:agentId
```

**Query Parameters**:
- `timeframe` (string, required): Candle timeframe (`1m`, `5m`, `15m`, `1h`, `4h`, `1d`)
- `from` (ISO string, required): Start date
- `to` (ISO string, required): End date
- `limit` (integer, optional): Max candles (default: 1000, max: 5000)

**Response**:
```json
{
  "agentId": "agent-uuid",
  "timeframe": "1h",
  "candles": [
    {
      "timestamp": "2024-01-15T12:00:00Z",
      "open": 0.000150,
      "high": 0.000158,
      "low": 0.000148,
      "close": 0.000152,
      "volume": 1250000,
      "volumePrompt": 190.50
    }
  ],
  "count": 24
}
```

---

### Get Liquidity Data

Get liquidity metrics for an agent token.

```
GET /get-liquidity/:agentId
```

**Response**:
```json
{
  "agentId": "agent-uuid",
  "totalLiquidity": 125000.50,
  "reserves": {
    "token": 85000000,
    "prompt": 12500.00
  },
  "liquidityPoolAddress": "0x...",
  "netFlow24h": 5400.20,
  "priceImpact": {
    "buy1000": 0.5,
    "buy10000": 2.3,
    "sell1000": 0.4,
    "sell10000": 2.1
  },
  "marketDepth": {
    "bids": [
      { "price": 0.000150, "amount": 1000000 }
    ],
    "asks": [
      { "price": 0.000155, "amount": 1000000 }
    ]
  }
}
```

---

### Build Trade Transaction

Construct transaction parameters for a trade.

```
POST /build-trade-tx
```

**Request Body**:
```json
{
  "agentId": "agent-uuid",
  "tradeType": "buy",
  "promptAmount": 100.0,
  "slippageTolerance": 0.5,
  "userAddress": "0x..."
}
```

**Parameters**:
- `agentId` (string, required): Agent UUID
- `tradeType` (string, required): `buy` or `sell`
- `promptAmount` (number, required for buy): PROMPT amount
- `tokenAmount` (number, required for sell): Token amount
- `slippageTolerance` (number, optional): Max slippage % (default: 0.5)
- `userAddress` (string, required): User wallet address

**Response**:
```json
{
  "transaction": {
    "to": "0x...",
    "data": "0x...",
    "value": "0",
    "gasLimit": "150000"
  },
  "trade": {
    "type": "buy",
    "promptAmount": 100.0,
    "tokenAmount": 656250.0,
    "pricePerToken": 0.000152,
    "priceImpact": 0.35,
    "slippage": 0.5,
    "minReceived": 652968.75,
    "fee": 0.5,
    "expectedOutput": 656250.0
  },
  "expiry": "2024-01-15T12:05:00Z"
}
```

---

### Get Market Overview

Get aggregated market statistics.

```
GET /get-market-overview
```

**Response**:
```json
{
  "totalAgents": 156,
  "totalVolume24h": 1250000.50,
  "totalMarketCap": 45000000.00,
  "totalHolders": 12450,
  "graduated": 23,
  "trending": [
    {
      "agentId": "agent-uuid",
      "name": "Trading Bot Alpha",
      "symbol": "TBA",
      "priceChange24h": 45.2,
      "volume24h": 125000.00
    }
  ]
}
```

---

## DEX Trading (Graduated Tokens)

For tokens that have graduated from the bonding curve to Uniswap V3 liquidity pools.

### Get DEX Quote

Get a transparent quote for trading graduated tokens on the DEX.

```
GET /get-dex-quote
```

**Query Parameters**:
- `agentId` (string, required): Agent UUID
- `side` (string, required): `buy` or `sell`
- `amount` (number, required): Amount of input token
- `slippage` (number, optional): Slippage tolerance in % (default: 0.5)

**Response**:
```json
{
  "ok": true,
  "data": {
    "input_amount": "100",
    "input_amount_raw": "100000000000000000000",
    "output_amount": "950000.123456",
    "output_amount_raw": "950000123456000000000000",
    "price_impact_percent": 0.25,
    "fee_percent": 0.3,
    "fee_amount": "0.300000",
    "gas_estimate": "150000",
    "gas_estimate_usd": 0.15,
    "effective_price": 0.000105,
    "min_output_amount": "945250.122873",
    "liquidity_pool": "0x...",
    "dex_type": "uniswap_v3",
    "route": ["0xPROMPT...", "0xAGENT..."],
    "pool_fee_tier": 3000,
    "expires_at": 1705320030000,
    "slippage_tolerance": 0.5
  },
  "agent": {
    "id": "uuid",
    "name": "Agent Name",
    "symbol": "AGENT",
    "token_address": "0x...",
    "current_price": 0.000105,
    "graduated": true
  }
}
```

**Error Response** (Non-graduated token):
```json
{
  "ok": false,
  "error": "Agent has not graduated yet - use bonding curve trading via trade-agent-token endpoint",
  "graduated": false
}
```

---

### Execute DEX Trade

Execute a swap on Uniswap V3 for graduated tokens.

```
POST /execute-dex-trade
```

**Request Body**:
```json
{
  "agentId": "agent-uuid",
  "userId": "0x...",
  "tradeType": "buy",
  "promptAmount": 100,
  "slippage": 0.5,
  "minOutputAmount": "945250122873000000000000",
  "poolFee": 3000
}
```

**Parameters**:
- `agentId` (string, required): Agent UUID
- `userId` (string, required): User's wallet address
- `tradeType` (string, required): `buy` or `sell`
- `promptAmount` (number): Amount of PROMPT (for buy trades)
- `tokenAmount` (number): Amount of agent tokens (for sell trades)
- `slippage` (number, optional): Slippage tolerance in % (default: 0.5)
- `minOutputAmount` (string, optional): Minimum output amount (raw wei)
- `poolFee` (number, optional): Uniswap fee tier (default: 3000 = 0.3%)

**Success Response** (Server-side execution):
```json
{
  "success": true,
  "transactionHash": "0x...",
  "approvalTxHash": "0x...",
  "srcAmount": "100000000000000000000",
  "srcAmountFormatted": "100",
  "dstAmount": "950000123456000000000000",
  "dstAmountFormatted": "950000.123456",
  "executedPrice": 0.000105,
  "gasUsed": "145000",
  "blockNumber": 12345678,
  "explorerUrl": "https://basescan.org/tx/0x...",
  "status": "success"
}
```

**Response** (Client-side signing required):
```json
{
  "success": true,
  "requiresClientSigning": true,
  "transactions": [
    {
      "step": "approve",
      "to": "0xPROMPT...",
      "data": "0x...",
      "value": "0",
      "description": "Approve 100 PROMPT for swap"
    },
    {
      "step": "swap",
      "to": "0xSwapRouter...",
      "data": "0x...",
      "value": "0",
      "description": "Swap 100 PROMPT for AGENT"
    }
  ],
  "quote": {
    "amountIn": "100000000000000000000",
    "minAmountOut": "945250122873000000000000",
    "slippage": 0.5,
    "poolFee": 3000,
    "tokenIn": "0x...",
    "tokenOut": "0x..."
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Swap failed: Insufficient liquidity or slippage too low",
  "details": "STF"
}
```

---

## Trading Flow Summary

| Token State | Endpoint | Description |
|-------------|----------|-------------|
| Pre-graduation | `trade-agent-token` | Bonding curve trading |
| Post-graduation | `get-dex-quote` | Get DEX quote with transparent fees |
| Post-graduation | `execute-dex-trade` | Execute swap on Uniswap V3 |

**Recommended Flow**:
1. Check `get-token-metadata` → `graduation.status`
2. If graduated: Use `get-dex-quote` → `execute-dex-trade`
3. If not graduated: Use `trade-agent-token`

---

## Caching Recommendations

- **Token List**: Cache for 30 seconds
- **Token Metadata**: Cache for 10 seconds
- **OHLC Data**: Cache for timeframe duration
- **Liquidity Data**: Cache for 5 seconds
- **DEX Quotes**: Do not cache (expires in 30 seconds)
- **Health Status**: Cache for 60 seconds

## Support

For API issues or questions:
- GitHub: github.com/promptbox/api-issues
- Discord: discord.gg/promptbox
- Email: api-support@promptbox.io
