#!/bin/bash

# Compile contracts and generate ABIs
echo "Compiling BondingCurveV5 contracts..."

# Install forge-std if not present
if [ ! -d "node_modules/forge-std" ]; then
    echo "Installing forge-std..."
    forge install foundry-rs/forge-std --no-commit
fi

# Compile contracts
forge build --force

# Create ABI output directory
mkdir -p contracts/abis

# Extract ABIs
echo "Extracting ABIs..."

jq '.abi' out/BondingCurveV5.sol/BondingCurveV5.json > contracts/abis/BondingCurveV5.json
jq '.abi' out/BondingCurveViewV5.sol/BondingCurveViewV5.json > contracts/abis/BondingCurveViewV5.json
jq '.abi' out/DexIntegrator.sol/DexIntegrator.json > contracts/abis/DexIntegrator.json
jq '.abi' out/DexIntegratorStub.sol/DexIntegratorStub.json > contracts/abis/DexIntegratorStub.json
jq '.abi' out/AgentTokenV5.sol/AgentTokenV5.json > contracts/abis/AgentTokenV5.json
jq '.abi' out/AgentFactoryV5.sol/AgentFactoryV5.json > contracts/abis/AgentFactoryV5.json
jq '.abi' out/PlatformVault.sol/PlatformVault.json > contracts/abis/PlatformVault.json

# Extract bytecode
echo "Extracting bytecode..."

jq '.bytecode.object' out/BondingCurveV5.sol/BondingCurveV5.json > contracts/abis/BondingCurveV5.bytecode
jq '.bytecode.object' out/AgentTokenV5.sol/AgentTokenV5.json > contracts/abis/AgentTokenV5.bytecode
jq '.bytecode.object' out/AgentFactoryV5.sol/AgentFactoryV5.json > contracts/abis/AgentFactoryV5.bytecode

echo "✅ Compilation complete!"
echo "ABIs saved to contracts/abis/"
echo ""
echo "To run tests: forge test -vvv"
echo "To run specific test: forge test --match-test testBuyTokens -vvv"
echo "To check coverage: forge coverage"
