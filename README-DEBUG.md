
# Trading Interface Debug Guide

## Phase 1: Immediate Debugging

### 1. SQL Testing
1. Navigate to Supabase SQL Editor
2. Open `sql-debug/test-trading-setup.sql`
3. Replace `YOUR_WALLET_ADDRESS` with your actual wallet address from the debug panel
4. Run each query section to verify:
   - User exists and has balance
   - Agent data is correct
   - Database function works
   - No existing trade conflicts

### 2. Create Fresh Test Token
1. Open `sql-debug/create-test-token.sql`
2. Replace `YOUR_WALLET_ADDRESS` with your wallet address
3. Run the script to create a fresh test agent
4. Navigate to the new agent using the returned ID

### 3. Debug Panel Usage
The yellow debug panel at the bottom shows:
- Your wallet address (copy button available)
- Current PROMPT balance
- Agent status and data
- Edge function connectivity
- Real-time system status (updates every 2 seconds)

### 4. Console Log Patterns
Watch for these specific patterns in the browser console:
- `🎯 TokenTradingInterface: Calling buyAgentTokens`
- `🔍 buyAgentTokens called with:` + parameters
- `🚀 Calling execute-trade with:` + request body
- `📊 Edge function response:` + response data
- `✅ Trade successful:` or `🚨 Trade failed:`

### 5. Edge Function Verification
Check if the execute-trade function is deployed:
```bash
supabase functions list
```

If not listed, deploy it:
```bash
supabase functions deploy execute-trade
```

## Expected Flow
1. User clicks buy button
2. `handleTrade` function logs trade parameters
3. `buyAgentTokens` is called with detailed logging
4. Edge function is invoked with request body logged
5. Response is logged and processed
6. Success/error toast is shown

## Common Issues to Look For
- Edge function not deployed (❌ in debug panel)
- User balance insufficient
- Agent in incorrect state
- Network connectivity issues
- Authentication problems

## Debug Panel Quick Actions
1. Copy wallet address for SQL scripts
2. Test edge function connectivity
3. Test SQL database function directly
4. Auto-refresh every 2 seconds
5. Manual refresh button available

Use this guide with the debug panel to identify exactly where the trading flow is breaking down.
