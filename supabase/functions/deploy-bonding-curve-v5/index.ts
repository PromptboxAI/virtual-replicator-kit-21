import { createPublicClient, createWalletClient, http } from 'npm:viem'
import { baseSepolia, base } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { verifyDeployment } from '../_shared/verifyDeployment.ts'

const CHAIN_CONFIG = {
  84532: { chain: baseSepolia, name: 'Base Sepolia' },
  8453: { chain: base, name: 'Base Mainnet' }
} as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// TODO: Replace with actual compiled bytecode from BondingCurveV5.sol
// This is a placeholder - contracts need to be compiled with Hardhat/Foundry
const BONDING_CURVE_V5_BYTECODE = "0x608060405234801561001057600080fd5b50";

const BONDING_CURVE_V5_ABI = [
  {
    "inputs": [
      {"name": "_promptToken", "type": "address"},
      {"name": "_platformVault", "type": "address"},
      {"name": "_treasury", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"name": "agentId", "type": "bytes32"},
      {"name": "promptIn", "type": "uint256"},
      {"name": "minTokensOut", "type": "uint256"}
    ],
    "name": "buy",
    "outputs": [{"name": "tokensOut", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "agentId", "type": "bytes32"},
      {"name": "tokensIn", "type": "uint256"},
      {"name": "minPromptOut", "type": "uint256"}
    ],
    "name": "sell",
    "outputs": [{"name": "promptOut", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "agentId", "type": "bytes32"}],
    "name": "getCurrentPrice",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      chainId = 84532, // Default to Base Sepolia
      promptTokenAddress,
      platformVaultAddress,
      treasuryAddress
    } = await req.json();

    if (!promptTokenAddress || !platformVaultAddress || !treasuryAddress) {
      throw new Error('Missing required addresses: promptTokenAddress, platformVaultAddress, treasuryAddress');
    }

    // Get deployment key
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not configured');
    }

    // Get chain config
    const chainConfig = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Create account and clients
    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    
    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http()
    });

    const walletClient = createWalletClient({
      account,
      chain: chainConfig.chain,
      transport: http()
    });

    console.log(`Deploying BondingCurveV5 on ${chainConfig.name}...`);
    console.log(`Deployer: ${account.address}`);

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Deployer balance: ${balance} wei`);

    if (balance === 0n) {
      throw new Error('Deployer account has no balance');
    }

    // Deploy contract
    const hash = await walletClient.deployContract({
      abi: BONDING_CURVE_V5_ABI,
      bytecode: BONDING_CURVE_V5_BYTECODE as `0x${string}`,
      args: [promptTokenAddress, platformVaultAddress, treasuryAddress],
    });

    console.log(`Deployment tx hash: ${hash}`);

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (!receipt.contractAddress) {
      throw new Error('Contract deployment failed - no contract address');
    }

    console.log(`BondingCurveV5 deployed to: ${receipt.contractAddress}`);

    // Verify deployment
    await verifyDeployment({
      agentId: null, // No agent associated with global bonding curve
      contractAddress: receipt.contractAddress,
      deploymentTxHash: hash,
      deploymentMethod: 'bonding_curve_v5',
      chainId,
      blockNumber: Number(receipt.blockNumber)
    });

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress: receipt.contractAddress,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        chainId,
        chainName: chainConfig.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Deployment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
