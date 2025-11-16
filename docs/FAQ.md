# Frequently Asked Questions (FAQ)

## General Questions

### What is Promptbox?

Promptbox is a platform for creating, trading, and managing AI agent tokens on the Base blockchain. Each agent has its own token with unique bonding curve mechanics that transition to DEX trading upon graduation.

### What blockchain does Promptbox use?

Promptbox operates on Base, an Ethereum Layer 2 network built by Coinbase. Base offers low transaction fees and fast confirmation times.

### Do I need cryptocurrency to use Promptbox?

Yes, you need:
- **ETH** (on Base) for gas fees
- **PROMPT tokens** for trading and creating agents

### How do I get started?

1. Connect a Web3 wallet (MetaMask, Coinbase Wallet, etc.)
2. Add Base network to your wallet
3. Bridge ETH to Base
4. Acquire PROMPT tokens
5. Start creating or trading agent tokens

---

## Wallet & Network

### What wallets are supported?

- MetaMask
- Coinbase Wallet
- WalletConnect compatible wallets
- Privy embedded wallet

### How do I add Base network to my wallet?

Most wallets automatically detect Base. To add manually:
- **Network Name**: Base
- **RPC URL**: https://mainnet.base.org
- **Chain ID**: 8453
- **Currency Symbol**: ETH
- **Block Explorer**: https://basescan.org

### How do I bridge funds to Base?

Use the official Base bridge:
1. Visit bridge.base.org
2. Connect your wallet
3. Select Ethereum → Base
4. Enter amount and confirm

Alternatively, use exchanges that support Base withdrawals.

### Why is my wallet not connecting?

Try these steps:
1. Refresh the page
2. Clear browser cache
3. Ensure you're on Base network
4. Try a different wallet
5. Check if wallet extension is updated

---

## Creating Agents

### How much does it cost to create an agent?

The default creation cost is 0.1 PROMPT plus gas fees (typically $0.10-0.50 in ETH).

### What information do I need to provide?

- **Name**: Agent name (e.g., "Trading Bot Alpha")
- **Symbol**: 3-4 letter token symbol (e.g., "TBA")
- **Description**: Explain your agent's purpose
- **Avatar**: Image file (recommended: 512x512px)
- **Category**: Agent type (Trading Bot, DeFi Assistant, etc.)

### Can I edit my agent after creation?

Yes, creators can update:
- Description
- Avatar
- Social media links
- Trading parameters
- Marketing materials

You cannot change:
- Name
- Symbol
- Token address
- Bonding curve parameters

### What is creator prebuy?

Creator prebuy allows you to automatically purchase tokens during agent creation. This:
- Shows commitment to your project
- Provides initial liquidity
- Sets a floor price

### How long does deployment take?

Typical deployment takes 30-60 seconds:
1. Transaction submission: ~5 seconds
2. Block confirmation: ~2 seconds
3. Contract deployment: ~10-20 seconds
4. Database sync: ~10-20 seconds

---

## Trading

### How does the bonding curve work?

The bonding curve is a mathematical formula that determines token price based on supply:

```
price = p0 + (p1 × tokensSold²)
```

- Price increases as more tokens are sold
- Price decreases when tokens are bought back
- Creates automatic liquidity

### What are the trading fees?

- **Trading Fee**: 0.5% per trade
- **Gas Fee**: Variable, typically $0.10-0.50
- **Graduation Fee**: 2% of raised funds (one-time)

### What is slippage?

Slippage is the difference between expected and actual trade price. It occurs due to:
- Price changes during transaction
- Large trade size impact
- Network congestion

**Recommended slippage**: 0.5-2%

### Why did my transaction fail?

Common reasons:
- **Insufficient gas**: Add more ETH
- **Slippage too low**: Increase tolerance
- **Price moved**: Retry transaction
- **Trade limit exceeded**: Reduce amount
- **Agent graduated**: Refresh page

### Can I cancel a pending transaction?

Yes, if it hasn't been confirmed:
1. Open your wallet
2. Find pending transaction
3. Click "Speed up" or "Cancel"
4. Confirm with higher gas

### What is price impact?

Price impact is how much your trade moves the market price. Larger trades have higher impact:
- **< 1%**: Low impact
- **1-3%**: Moderate impact
- **> 3%**: High impact

Monitor price impact before trading large amounts.

---

## Graduation

### What is graduation?

Graduation is when an agent token reaches its funding threshold and transitions from bonding curve to DEX trading on Uniswap V3.

### When does graduation occur?

Default threshold: **50,000 PROMPT raised**

Progress is shown in the graduation bar on each agent's page.

### What happens during graduation?

1. New V2 contract deployed
2. Uniswap V3 liquidity pool created
3. Remaining tokens + raised PROMPT added as liquidity
4. LP tokens locked for 1 year
5. Trading switches to DEX

### How long does graduation take?

Graduation typically takes 2-5 minutes:
1. Trigger event: Immediate
2. Contract deployment: ~30 seconds
3. Pool creation: ~30 seconds
4. Liquidity addition: ~1 minute
5. State updates: ~30 seconds

### Can I trade during graduation?

No, trading is paused during graduation (2-5 minutes). You'll see a message indicating graduation is in progress.

### What happens to my tokens after graduation?

Your tokens automatically work with the new V2 contract. No action needed. You can:
- Continue holding
- Trade on Uniswap
- Provide liquidity for rewards

### Does price change at graduation?

No, price continuity is maintained. The initial DEX price matches the final bonding curve price.

---

## Platform Vault

### What is the Platform Vault?

The Platform Vault collects trading and graduation fees, then distributes them to:
- 50% Agent creators
- 30% Liquidity providers
- 20% Platform treasury

### How do I claim rewards?

1. Navigate to your agent dashboard
2. View "Claimable Rewards"
3. Click "Claim Rewards"
4. Confirm transaction
5. Rewards sent to your wallet

### When can I claim rewards?

Rewards can be claimed anytime. No minimum amount required, but consider gas costs for small claims.

### How are rewards calculated?

Rewards accumulate from:
- **Trading fees**: 0.5% of your agent's trade volume
- **Graduation fees**: 2% of raised funds at graduation
- **LP rewards**: Share of trading fees (if providing liquidity)

### Do rewards expire?

No, unclaimed rewards never expire. Claim whenever convenient.

---

## Security & Safety

### Is Promptbox secure?

Security measures include:
- Audited smart contracts
- Non-custodial (you control your funds)
- Transparent on-chain transactions
- Reentrancy protection
- Access control mechanisms

### What are the risks?

**Smart Contract Risk**:
- Code bugs (mitigated by audits)
- Economic exploits

**Market Risk**:
- Price volatility
- Liquidity changes
- Impermanent loss (LPs)

**User Risk**:
- Wallet compromise
- Phishing attacks
- Transaction errors

### How do I protect my wallet?

- Use hardware wallet for large holdings
- Never share private keys/seed phrase
- Verify contract addresses
- Be cautious of phishing sites
- Enable 2FA on exchanges

### What if I lost my private key?

Unfortunately, lost private keys cannot be recovered. This is why it's critical to:
- Backup seed phrase securely
- Store in multiple secure locations
- Never store digitally
- Use hardware wallet for large amounts

### How do I report a security issue?

**Critical vulnerabilities**:
- Email: security@promptbox.io
- Do not disclose publicly

**General issues**:
- GitHub: github.com/promptbox/security-issues
- Discord: #security channel

---

## Technical Issues

### Why is data not updating?

Try these steps:
1. Refresh the page
2. Clear browser cache
3. Check network connection
4. Verify correct network selected
5. Wait 30 seconds for sync

### Why are prices different on different pages?

Possible reasons:
- Cache delay (data updates every 5-10 seconds)
- Graduation transition (check graduation status)
- Browser displaying old cached data

Refresh page to sync latest prices.

### Chart is not loading

Solutions:
1. Check browser console for errors
2. Disable ad blockers
3. Try different browser
4. Clear site data
5. Check if agent is graduated

### Transaction is pending for too long

If pending > 5 minutes:
1. Check network congestion on BaseScan
2. Try speeding up transaction in wallet
3. If failed, retry with higher gas
4. Contact support if issue persists

### Error: "Insufficient gas"

You need more ETH for gas fees:
1. Bridge more ETH to Base
2. Or use faucet for testnet

### Error: "Insufficient liquidity"

This occurs when:
- Trade size too large for available liquidity
- Agent just graduated (wait for pool stabilization)
- Network congestion

Solutions:
- Reduce trade size
- Wait and retry
- Split into smaller trades

---

## Account & Billing

### How much does Promptbox cost?

**Platform**: Free to use

**Costs**:
- Creation fee: 0.1 PROMPT
- Trading fee: 0.5% per trade
- Gas fees: Variable ($0.10-0.50 typically)

### Do I need to create an account?

No traditional account needed. Your wallet address is your identity. However, you can:
- Connect social profiles
- Save preferences
- Enable notifications

### Can I have multiple agents?

Yes! Create unlimited agents. Each requires:
- Unique name and symbol
- Creation fee per agent
- Separate token addresses

### How do I delete my account?

Promptbox is non-custodial, so there's no "account" to delete. However, you can:
- Disconnect wallet
- Clear browser data
- Remove social connections

Your on-chain activity remains permanent and visible on blockchain.

---

## Support

### How do I get help?

**Documentation**: 
- User Guide: docs/USER_GUIDE.md
- API Docs: docs/API_DOCUMENTATION.md
- Smart Contracts: docs/SMART_CONTRACTS.md

**Community**:
- Discord: discord.gg/promptbox
- Twitter: @promptbox
- Telegram: t.me/promptbox

**Direct Support**:
- Email: support@promptbox.io
- Response time: 24-48 hours

### How do I report a bug?

1. Check if known issue in Discord
2. Gather details:
   - Steps to reproduce
   - Screenshots/videos
   - Transaction hashes
   - Browser console errors
3. Submit:
   - GitHub: github.com/promptbox/issues
   - Discord: #bug-reports
   - Email: bugs@promptbox.io

### How do I suggest a feature?

We welcome feedback!
- Discord: #feature-requests
- GitHub: Create feature request issue
- Community calls: Monthly (announced in Discord)

### Where can I learn more?

**Resources**:
- Blog: blog.promptbox.io
- YouTube: Educational videos and tutorials
- Twitter: @promptbox for updates
- GitHub: Open source code and docs

**Learning Path**:
1. Read User Guide (30 min)
2. Watch tutorial videos (1 hour)
3. Create test agent (testnet)
4. Join community calls
5. Start trading small amounts

---

## Advanced Topics

### Can I integrate Promptbox into my app?

Yes! Use our public API:
- See API_DOCUMENTATION.md
- No authentication required for public endpoints
- Rate limits apply
- Websocket support via Supabase Realtime

### Is there an SDK?

JavaScript/TypeScript SDK is in development. Current options:
- Direct API calls
- Supabase client library
- Web3 libraries (wagmi, viem)

### Can I run my own interface?

Yes! Promptbox is open source:
- Frontend: React + TypeScript
- Smart contracts: Solidity
- Backend: Supabase Edge Functions

Fork and customize as needed.

### How do I become a liquidity provider?

After agent graduation:
1. Go to Uniswap V3
2. Find agent's liquidity pool
3. Add liquidity (AGENT/PROMPT pair)
4. Receive LP tokens
5. Earn trading fees

**Note**: Understand impermanent loss before providing liquidity.

### Can I programmatically trade?

Yes, using smart contract interactions:
```typescript
// Example using wagmi
const { writeContract } = useWriteContract();

await writeContract({
  address: tokenAddress,
  abi: AgentTokenABI,
  functionName: 'buy',
  args: [promptAmount]
});
```

See SMART_CONTRACTS.md for full documentation.

---

## Glossary

**Agent**: AI entity with its own tradeable token

**Bonding Curve**: Mathematical formula determining token price

**DEX**: Decentralized Exchange (e.g., Uniswap)

**FDV**: Fully Diluted Valuation (market cap if all tokens in circulation)

**Gas**: Transaction fee paid to network validators

**Graduation**: Transition from bonding curve to DEX trading

**LP**: Liquidity Provider

**PROMPT**: Platform's native trading token

**Slippage**: Difference between expected and actual trade price

**TVL**: Total Value Locked in liquidity pools

**Web3**: Decentralized internet using blockchain technology

---

*Last updated: January 2024*
*For the latest information, visit docs.promptbox.io*
