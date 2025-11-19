# BondingCurveV5 Test Suite

Comprehensive Foundry tests for the BondingCurveV5 contract system.

## Running Tests

### Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies
```bash
npm install
forge install foundry-rs/forge-std --no-commit
```

### Run All Tests
```bash
forge test -vvv
```

### Run Specific Tests
```bash
# Test buy functionality
forge test --match-test testBuy -vvv

# Test sell functionality
forge test --match-test testSell -vvv

# Test graduation
forge test --match-test testGraduation -vvv

# Test admin functions
forge test --match-test testSet -vvv

# Test reentrancy protection
forge test --match-test testReentrancy -vvv
```

### Generate Coverage Report
```bash
forge coverage
forge coverage --report lcov
```

### Gas Reporting
```bash
forge test --gas-report
```

## Test Coverage

### BondingCurveV5.t.sol
Core bonding curve functionality:
- ✅ Buy operations with fee distribution
- ✅ Sell operations with fee distribution  
- ✅ Graduation logic and thresholds
- ✅ Admin functions (setFees, setFeeDistribution, etc.)
- ✅ Reentrancy protection
- ✅ Edge cases and invariants
- ✅ Slippage protection
- ✅ Price mechanics

### BondingCurveView.t.sol
View functions and metrics:
- ✅ getMetrics() at various states
- ✅ calculateBuyReturn()
- ✅ calculateSellReturn()
- ✅ Graduation progress calculation

## Test Scenarios

### Buy Tests
1. Basic buy operation
2. Buy with minimum output
3. Slippage protection
4. Fee distribution (creator/platform/LP)
5. Revert when graduated
6. Minimum amount handling

### Sell Tests
1. Basic sell operation
2. Sell with fees applied
3. Revert on insufficient reserves
4. Revert when graduated
5. Round-trip value loss

### Graduation Tests
1. Triggers at threshold
2. Metrics validation
3. Prevents trading after graduation

### Admin Tests
1. setFees() with validation
2. setFeeDistribution() with validation
3. updatePlatformVault()
4. updateTreasury()
5. Access control enforcement

### Security Tests
1. Reentrancy protection on buy
2. Reentrancy protection on sell
3. Cannot sell more than sold supply
4. Fee caps enforced

### Invariant Tests
1. Price increases with supply
2. Reserves never negative
3. Tokens sold never exceeds supply
4. Fee distributions sum to 100%

## Compiling and Generating ABIs

Run the compilation script:
```bash
chmod +x scripts/compile-contracts.sh
./scripts/compile-contracts.sh
```

This will:
1. Compile all contracts
2. Extract ABIs to `contracts/abis/`
3. Extract bytecode for deployment

## Integration with TypeScript

After generating ABIs, import them in TypeScript:
```typescript
import BondingCurveV5ABI from '@/contracts/abis/BondingCurveV5.json';
```

## Continuous Integration

GitHub Actions workflow runs tests automatically on:
- Push to main/develop
- Pull requests

See `.github/workflows/foundry-tests.yml` for CI configuration.
