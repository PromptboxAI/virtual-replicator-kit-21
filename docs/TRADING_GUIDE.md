# Trading Guide

## Introduction

This guide covers everything you need to know about trading agent tokens on Promptbox, from basic concepts to advanced strategies.

## Getting Started

### Prerequisites

Before trading, ensure you have:
- Web3 wallet connected
- ETH on Base for gas fees
- PROMPT tokens for trading
- Understanding of basic crypto trading concepts

### Understanding the Trading Interface

The trading interface consists of four main sections:

1. **Price Chart** - Visual representation of price history
2. **Order Panel** - Buy/sell execution
3. **Metrics Bar** - Key statistics (FDV, volume, holders, etc.)
4. **Transaction History** - Recent trades

## Bonding Curve Mechanics

### How It Works

Agent tokens use a bonding curve pricing model:

```
price = p0 + (p1 × tokensSold²)
```

**Key Characteristics**:
- Price increases as supply is purchased
- Price decreases as supply is sold back
- Automatic liquidity (no need for order books)
- Deterministic pricing

### Example

For an agent with:
- `p0 = 0.0001` (initial price)
- `p1 = 0.000000001` (growth rate)
- `tokensSold = 100,000,000` (current supply sold)

Current price:
```
price = 0.0001 + (0.000000001 × 100,000,000²)
price = 0.0001 + 10
price = 10.0001 PROMPT per token
```

### Price Impact

Larger trades have higher price impact:

**Small Trade** (1,000 tokens):
- Low price impact (< 0.5%)
- Minimal slippage
- Fast execution

**Large Trade** (1,000,000 tokens):
- High price impact (> 5%)
- Significant slippage
- Consider breaking into smaller trades

## Placing Trades

### Buying Tokens

**Step-by-Step**:

1. **Navigate to Agent Page**
   - Find agent via search or browse
   - Review metrics and chart

2. **Open Order Panel**
   - Select "Buy" tab
   - Choose PROMPT input or token output

3. **Enter Amount**
   ```
   Input: 100 PROMPT
   Expected: ~6,562 tokens
   Price Impact: 1.2%
   Slippage: 0.5%
   Fee: 0.5 PROMPT
   ```

4. **Review Details**
   - Check price per token
   - Verify price impact
   - Confirm slippage tolerance

5. **Execute Trade**
   - Click "Buy"
   - Approve PROMPT spending (first time)
   - Confirm transaction in wallet
   - Wait for confirmation (~2 seconds)

### Selling Tokens

**Step-by-Step**:

1. **Open Order Panel**
   - Select "Sell" tab
   - Enter token amount to sell

2. **Review Output**
   ```
   Selling: 6,562 tokens
   Expected: ~99.5 PROMPT
   Price Impact: 1.2%
   Slippage: 0.5%
   Fee: 0.5 PROMPT
   ```

3. **Execute Trade**
   - Click "Sell"
   - Confirm transaction
   - Wait for confirmation

### Understanding Fees

**Trading Fee**: 0.5% of trade value
```
Trade: 100 PROMPT
Fee: 0.5 PROMPT
Net: 99.5 PROMPT worth of tokens
```

**Gas Fee**: Variable, typically $0.10-0.50
- Depends on network congestion
- Adjust gas price for faster confirmation

**Graduation Fee**: 2% one-time (at graduation)
- Deducted from raised funds
- Used for liquidity provision

## Slippage Protection

### What is Slippage?

Slippage is the difference between expected and actual execution price.

**Causes**:
- Price changes during transaction
- Large trade size
- Network congestion
- Front-running

### Setting Slippage Tolerance

**Low (0.1-0.5%)**:
- Pros: Protection against unfavorable prices
- Cons: Higher chance of transaction failure

**Medium (0.5-2%)**:
- Pros: Balance of protection and success rate
- Cons: Moderate price variance

**High (2-5%)**:
- Pros: Almost always executes
- Cons: Vulnerable to poor pricing

**Recommended**: Start with 0.5%, increase if transactions fail.

### Minimum Received

Set minimum tokens received to protect against excessive slippage:

```
Expected: 1,000 tokens
Slippage: 1%
Min Received: 990 tokens
```

Transaction reverts if you'd receive < 990 tokens.

## Advanced Trading Strategies

### Dollar-Cost Averaging (DCA)

Reduce volatility risk by spreading purchases over time:

**Example**:
- Total budget: 1,000 PROMPT
- Strategy: Buy 100 PROMPT every day for 10 days
- Benefits: Average out price fluctuations

**Implementation**:
```
Day 1: Buy 100 PROMPT worth @ 0.00015
Day 2: Buy 100 PROMPT worth @ 0.00018
Day 3: Buy 100 PROMPT worth @ 0.00012
...
Average Price: ~0.00015
```

### Limit Orders (Manual)

Since no limit orders on bonding curve, use price alerts:

1. Set price alert at target
2. Execute market order when alerted
3. Monitor slippage carefully

### Graduation Trading

**Pre-Graduation Strategy**:
- Buy before 50k threshold
- Anticipate increased demand
- Monitor progress bar

**Post-Graduation Strategy**:
- Wait for DEX price stabilization
- Use DEX limit orders
- Provide liquidity for fees

### Swing Trading

Trade based on chart patterns and indicators:

**Tools**:
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Volume analysis
- Support/resistance levels

**Example Strategy**:
```
Buy Signal:
- RSI < 30 (oversold)
- Price at support level
- Volume increasing

Sell Signal:
- RSI > 70 (overbought)
- Price at resistance level
- Volume decreasing
```

## Chart Analysis

### Timeframes

Choose timeframe based on strategy:

**1-minute (1m)**: 
- Scalping
- High-frequency trading
- Requires constant monitoring

**5-minute (5m)**:
- Day trading
- Intraday price movements
- Good for quick decisions

**1-hour (1h)**:
- Swing trading
- Trend identification
- Balanced view

**1-day (1d)**:
- Long-term trends
- Position trading
- Big picture analysis

### Technical Indicators

**RSI (Relative Strength Index)**:
- Range: 0-100
- > 70: Overbought (sell signal)
- < 30: Oversold (buy signal)

**MACD**:
- Trend following indicator
- Bullish: MACD line crosses above signal line
- Bearish: MACD line crosses below signal line

**Volume**:
- Confirms price movements
- High volume = strong trend
- Low volume = weak trend

**Moving Averages**:
- 20 MA: Short-term trend
- 50 MA: Medium-term trend
- 200 MA: Long-term trend

### Chart Patterns

**Bullish Patterns**:
- Double Bottom
- Cup and Handle
- Ascending Triangle
- Bullish Flag

**Bearish Patterns**:
- Double Top
- Head and Shoulders
- Descending Triangle
- Bearish Flag

## Risk Management

### Position Sizing

Never risk more than you can afford to lose:

**Conservative**: 1-2% of portfolio per trade
**Moderate**: 2-5% of portfolio per trade
**Aggressive**: 5-10% of portfolio per trade

**Example**:
```
Portfolio: 10,000 PROMPT
Risk: 2% (200 PROMPT)
Position: 200 PROMPT per trade
```

### Stop Loss (Manual)

Set mental stop loss levels:

**Example**:
```
Entry: 0.00015
Stop Loss: 0.00012 (-20%)
Take Profit: 0.00021 (+40%)
Risk/Reward: 1:2
```

### Diversification

Don't put all funds in one agent:

**Balanced Portfolio**:
- 40% established agents (high volume)
- 30% mid-cap agents (moderate risk)
- 20% new agents (high risk/reward)
- 10% cash (PROMPT) for opportunities

### Avoiding Common Mistakes

**Don't**:
- FOMO (Fear of Missing Out)
- Revenge trading after losses
- Over-leverage positions
- Ignore price impact on large trades
- Trade without stop losses

**Do**:
- Stick to your strategy
- Take profits gradually
- Cut losses quickly
- Research before trading
- Keep emotions in check

## Graduation Impact

### Pre-Graduation Phase

**Characteristics**:
- Bonding curve pricing
- Lower liquidity
- Higher price impact
- Direct contract trading

**Strategy**:
- Accumulate before threshold
- Monitor progress (< 45k PROMPT)
- Expect volatility near graduation

### Graduation Process

**Timeline** (2-5 minutes):
```
1. Threshold reached (50k PROMPT)
2. V2 contract deployment (~30s)
3. Uniswap pool creation (~30s)
4. Liquidity addition (~1m)
5. Trading resumes on DEX (~30s)
```

**During Graduation**:
- Trading paused
- Price frozen
- Wait for completion

### Post-Graduation Phase

**Characteristics**:
- DEX trading (Uniswap V3)
- Higher liquidity
- Professional trading features
- Limit orders available

**Strategy**:
- Wait for price stabilization (1-24 hours)
- Use DEX limit orders
- Consider providing liquidity
- Monitor DEX vs bonding curve price

## Mobile Trading

### Optimizations

Mobile interface adjustments:
- Simplified chart view
- Touch-friendly controls
- Portrait/landscape support
- Quick trade buttons

### Best Practices

**Mobile Trading Tips**:
- Use WiFi for important trades
- Double-check amounts before confirming
- Save frequent agents to watchlist
- Enable price alerts
- Use landscape for chart analysis

## Transaction Troubleshooting

### Transaction Failed

**Causes & Solutions**:

1. **Insufficient Gas**
   - Add more ETH to wallet
   - Typical gas: $0.10-0.50

2. **Slippage Too Low**
   - Increase slippage tolerance
   - Try 1-2% for volatile agents

3. **Price Moved**
   - Refresh price data
   - Retry transaction

4. **Trade Limit Exceeded**
   - Reduce trade size
   - Check agent's max trade amount

5. **Agent Graduated**
   - Refresh page
   - Trade on DEX instead

### Pending Too Long

If transaction pending > 5 minutes:

1. Check BaseScan for status
2. Speed up in wallet (higher gas)
3. Cancel and retry if needed
4. Contact support if stuck

### Wrong Amount Received

**Possible Causes**:
- Price changed during execution (slippage)
- High price impact on large trade
- Fee deduction not accounted for

**Verify**:
- Check transaction on BaseScan
- Review price impact shown before trade
- Confirm fee was deducted correctly

## API Trading

### Building a Trading Bot

Use the public API for automated trading:

```typescript
// Get current price
const response = await fetch(
  `${API_URL}/get-token-metadata/${agentId}`
);
const { pricing } = await response.json();

// Build trade
const trade = await fetch(`${API_URL}/build-trade-tx`, {
  method: 'POST',
  body: JSON.stringify({
    agentId,
    tradeType: 'buy',
    promptAmount: 100,
    userAddress: address
  })
});

// Execute with wallet
const hash = await executeTransaction(trade);
```

### Real-time Price Updates

Subscribe to live price changes:

```typescript
const subscription = supabase
  .channel('prices')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'agent_token_buy_trades',
      filter: `agent_id=eq.${agentId}`
    },
    (payload) => {
      updatePrice(payload.new);
    }
  )
  .subscribe();
```

## Tax Reporting

### Taxable Events

**In most jurisdictions**:
- Selling tokens for PROMPT (capital gains)
- Swapping tokens (disposal)
- Receiving rewards (income)

**Not typically taxable**:
- Buying tokens with PROMPT
- Holding tokens
- Transferring to your own wallets

### Record Keeping

Track for each trade:
- Date and time
- Agent token
- Amount bought/sold
- Price in PROMPT and USD
- Transaction hash
- Purpose (investment, trading, etc.)

### Tools

- Export transaction history from Promptbox
- Use BaseScan for on-chain records
- Crypto tax software: CoinTracker, Koinly, etc.

**Disclaimer**: Consult a tax professional for your jurisdiction.

## Best Practices Summary

1. **Research First**: Understand agent before trading
2. **Start Small**: Test with small amounts initially
3. **Use Slippage Protection**: Set appropriate tolerance
4. **Monitor Price Impact**: Especially on large trades
5. **Diversify**: Don't concentrate in one agent
6. **Set Targets**: Define entry, exit, and stop loss
7. **Stay Informed**: Monitor graduation progress
8. **Manage Risk**: Only trade with affordable funds
9. **Keep Records**: Track all transactions
10. **Be Patient**: Don't chase pumps or panic sell

## Resources

- **API Docs**: docs/API_DOCUMENTATION.md
- **Smart Contracts**: docs/SMART_CONTRACTS.md
- **FAQ**: docs/FAQ.md
- **Discord**: Trading discussion and signals
- **Twitter**: @promptbox for updates

---

*Last updated: January 2024*
*Trading involves risk. Only trade with funds you can afford to lose.*
