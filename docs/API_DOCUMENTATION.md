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

### Get Leaderboards

Get top performing agents by various metrics.

```
GET /get-leaderboards
```

**Query Parameters**:
- `metric` (string, optional): `volume`, `marketCap`, `holders`, `gainers`, `losers` (default: `volume`)
- `limit` (integer, optional): Results to return (default: 10, max: 50)

**Response**:
```json
{
  "metric": "volume",
  "leaderboard": [
    {
      "rank": 1,
      "agentId": "agent-uuid",
      "name": "Trading Bot Alpha",
      "symbol": "TBA",
      "value": 125000.50,
      "change24h": 15.42
    }
  ],
  "lastUpdated": "2024-01-15T12:00:00Z"
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": {
    "code": "TOKEN_NOT_FOUND",
    "message": "Agent token not found",
    "details": "No agent found with id: invalid-uuid"
  }
}
```

**Common Error Codes**:
- `TOKEN_NOT_FOUND` - Agent token doesn't exist
- `INVALID_PARAMETERS` - Invalid query parameters
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error
- `GRADUATION_IN_PROGRESS` - Agent is graduating
- `INSUFFICIENT_LIQUIDITY` - Not enough liquidity for trade

## Rate Limiting

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

## Webhooks

Webhooks are not currently supported. Use Supabase Realtime for live updates:

```typescript
import { supabase } from './supabase/client';

// Subscribe to trade events
const subscription = supabase
  .channel('trades')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'agent_token_buy_trades'
    },
    (payload) => {
      console.log('New trade:', payload);
    }
  )
  .subscribe();
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Fetch token metadata
const response = await fetch(
  `${API_BASE_URL}/get-token-metadata/${agentId}`
);
const data = await response.json();

// Build trade transaction
const tradeResponse = await fetch(
  `${API_BASE_URL}/build-trade-tx`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId,
      tradeType: 'buy',
      promptAmount: 100,
      userAddress: address
    })
  }
);
const trade = await tradeResponse.json();

// Execute with wagmi/viem
const hash = await writeContract({
  address: trade.transaction.to,
  abi: contractABI,
  functionName: 'buy',
  args: [/* ... */]
});
```

### Python

```python
import requests

# Get token list
response = requests.get(
    f"{API_BASE_URL}/list-tokens",
    params={"limit": 10, "sortBy": "volume"}
)
tokens = response.json()

# Get OHLC data
response = requests.get(
    f"{API_BASE_URL}/get-ohlc/{agent_id}",
    params={
        "timeframe": "1h",
        "from": "2024-01-15T00:00:00Z",
        "to": "2024-01-15T23:59:59Z"
    }
)
ohlc = response.json()
```

## Caching Recommendations

- **Token List**: Cache for 30 seconds
- **Token Metadata**: Cache for 10 seconds
- **OHLC Data**: Cache for timeframe duration
- **Liquidity Data**: Cache for 5 seconds
- **Health Status**: Cache for 60 seconds

## Support

For API issues or questions:
- GitHub: github.com/promptbox/api-issues
- Discord: discord.gg/promptbox
- Email: api-support@promptbox.io
