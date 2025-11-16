# User Guide

## Getting Started with Promptbox

Welcome to Promptbox - the platform for creating, trading, and managing AI agent tokens on Base blockchain.

## Creating Your First Agent Token

### Prerequisites
- Connect your wallet (MetaMask, Coinbase Wallet, or WalletConnect)
- Have ETH on Base network for gas fees
- Have PROMPT tokens for agent creation

### Step-by-Step Process

1. **Navigate to Create Agent**
   - Click "Create Agent" in the navigation menu
   - Choose your agent type (Trading Bot, DeFi Assistant, Content Creator, etc.)

2. **Configure Your Agent**
   - **Name**: Choose a unique, memorable name
   - **Symbol**: 3-4 letter token symbol
   - **Description**: Explain your agent's purpose and capabilities
   - **Avatar**: Upload an image (recommended: 512x512px)

3. **Set Trading Parameters**
   - **Creation Cost**: Amount of PROMPT required (default: 0.1 PROMPT)
   - **Creator Prebuy**: Optional initial token purchase
   - **Max Trade Amount**: Maximum tokens per trade

4. **Deploy**
   - Review all settings
   - Approve PROMPT spending
   - Sign deployment transaction
   - Wait for confirmation (typically 30-60 seconds)

## Trading Agent Tokens

### Understanding the Trading Interface

The trading interface consists of several key components:

1. **Price Chart** - Real-time price visualization with technical indicators
2. **Order Panel** - Buy/sell interface with slippage protection
3. **Metrics Bar** - FDV, volume, price change, holders, liquidity
4. **Transaction History** - Your recent trades

### Placing a Trade

1. **Buy Tokens**
   - Select "Buy" tab
   - Enter PROMPT amount or token quantity
   - Review price impact and slippage
   - Click "Buy" and confirm transaction

2. **Sell Tokens**
   - Select "Sell" tab
   - Enter token quantity to sell
   - Review expected PROMPT output
   - Click "Sell" and confirm transaction

### Understanding Bonding Curve

Agents use a bonding curve pricing mechanism:
- Price increases as more tokens are sold
- Price decreases when tokens are bought back
- Formula: `price = p0 + (p1 * tokensSold²)`
- Graduated tokens transition to DEX trading

## Graduation Process

### What is Graduation?

Graduation occurs when an agent token reaches its funding threshold and transitions from bonding curve to DEX trading.

### Graduation Threshold

- Default: 50,000 PROMPT raised
- Progress displayed in graduation bar
- Automatic transition when threshold reached

### What Happens at Graduation?

1. **Token Migration**: V2 contract deployed
2. **Liquidity Pool**: Created on Uniswap V3
3. **Trading Transition**: From bonding curve to DEX
4. **Price Continuity**: Maintained through migration

### Post-Graduation Benefits

- Higher liquidity
- Professional DEX features
- Wider trading access
- Platform vault rewards

## Platform Vault

### What is the Platform Vault?

The Platform Vault is a smart contract that collects and distributes platform fees to stakeholders.

### Revenue Sources

- Trading fees (0.5% per trade)
- Graduation fees (2% of raised funds)
- Platform allocations

### Distribution

- 50% to creator
- 30% to liquidity providers
- 20% to platform treasury

### Claiming Rewards

1. Navigate to your agent dashboard
2. View accumulated rewards
3. Click "Claim Rewards"
4. Confirm transaction

## Wallet Management

### Supported Wallets

- MetaMask
- Coinbase Wallet
- WalletConnect compatible wallets
- Privy embedded wallet

### Network Requirements

- **Network**: Base (Chain ID: 8453)
- **Gas Token**: ETH
- **Trading Token**: PROMPT

### Adding Base Network

Most wallets auto-detect Base. If needed, add manually:
- RPC URL: `https://mainnet.base.org`
- Chain ID: `8453`
- Currency Symbol: `ETH`
- Block Explorer: `https://basescan.org`

## Safety & Best Practices

### Security Tips

- Never share your private keys or seed phrase
- Verify contract addresses before transactions
- Start with small trades to test
- Use hardware wallets for large holdings

### Trading Best Practices

- Set appropriate slippage tolerance (0.5-2%)
- Monitor price impact on large trades
- Review transaction details before confirming
- Keep some ETH for gas fees

### Risk Management

- Only invest what you can afford to lose
- Diversify across multiple agents
- Understand bonding curve mechanics
- Monitor graduation progress

## Troubleshooting

### Common Issues

**Transaction Failed**
- Insufficient gas (add more ETH)
- Slippage too low (increase tolerance)
- Network congestion (wait and retry)

**Wallet Not Connecting**
- Refresh page
- Clear browser cache
- Try different wallet
- Check network selection

**Price Discrepancy**
- Refresh data
- Check graduation status
- Verify correct agent selected

### Getting Help

- Check FAQ documentation
- Join Discord community
- Contact support team
- Review technical documentation

## Advanced Features

### Chart Tools

- Drawing tools (trend lines, channels)
- Technical indicators (RSI, MACD, Volume)
- Multiple timeframes (1m, 5m, 1h, 1d)
- Price alerts

### Analytics

- Holder distribution
- Volume analysis
- Price history
- Liquidity metrics

### API Access

For developers building integrations:
- See API_DOCUMENTATION.md
- Public endpoints available
- Rate limits apply
- Authentication optional

## Support Resources

- **Documentation**: docs.promptbox.io
- **Discord**: discord.gg/promptbox
- **Twitter**: @promptbox
- **Email**: support@promptbox.io
