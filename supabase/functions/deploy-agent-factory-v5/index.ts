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

// TODO: Replace with actual compiled bytecode from AgentFactoryV5.sol
const AGENT_FACTORY_V5_BYTECODE = "0x608060405234801561001057600080fd5b50";

const AGENT_FACTORY_V5_ABI = [
  {
    "inputs": [{"name": "_bondingCurve", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "p0", "type": "uint256"},
      {"name": "p1", "type": "uint256"},
      {"name": "graduationThresholdPrompt", "type": "uint256"}
    ],
    "name": "createAgent",
    "outputs": [
      {"name": "agentId", "type": "bytes32"},
      {"name": "agentToken", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bondingCurve",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "agentId", "type": "bytes32"},
      {"indexed": true, "name": "agentToken", "type": "address"},
      {"indexed": true, "name": "creator", "type": "address"},
      {"indexed": false, "name": "name", "type": "string"},
      {"indexed": false, "name": "symbol", "type": "string"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "AgentCreated",
    "type": "event"
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      chainId = 84532, // Default to Base Sepolia
      bondingCurveAddress
    } = await req.json();

    if (!bondingCurveAddress) {
      throw new Error('Missing required address: bondingCurveAddress');
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

    console.log(`Deploying AgentFactoryV5 on ${chainConfig.name}...`);
    console.log(`Deployer: ${account.address}`);
    console.log(`BondingCurve: ${bondingCurveAddress}`);

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Deployer balance: ${balance} wei`);

    if (balance === 0n) {
      throw new Error('Deployer account has no balance');
    }

    // Deploy contract
    const hash = await walletClient.deployContract({
      abi: AGENT_FACTORY_V5_ABI,
      bytecode: AGENT_FACTORY_V5_BYTECODE as `0x${string}`,
      args: [bondingCurveAddress],
    });

    console.log(`Deployment tx hash: ${hash}`);

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (!receipt.contractAddress) {
      throw new Error('Contract deployment failed - no contract address');
    }

    console.log(`AgentFactoryV5 deployed to: ${receipt.contractAddress}`);

    // Verify deployment
    await verifyDeployment({
      agentId: null, // No agent associated with factory
      contractAddress: receipt.contractAddress,
      deploymentTxHash: hash,
      deploymentMethod: 'agent_factory_v5',
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
