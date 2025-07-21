import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Combined ABI for both V1 and V2 contracts
const AGENT_TOKEN_ABI = [
  // V1 functions
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // V2 functions
  {
    "inputs": [],
    "name": "version",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "v1Contract", "type": "address"}],
    "name": "migrateFromV1",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "holder", "type": "address"}],
    "name": "getMigrationEligibility",
    "outputs": [
      {"internalType": "bool", "name": "eligible", "type": "bool"},
      {"internalType": "uint256", "name": "v1Balance", "type": "uint256"},
      {"internalType": "uint256", "name": "migrationRatio", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface MigrationInfo {
  v1Contract: string;
  v2Contract: string;
  agentId: string;
  totalV1Supply: bigint;
  totalV1Holders: number;
  migrationRatio: bigint; // e.g., 1000 = 1:1 ratio (with 3 decimals precision)
}

async function getContractVersion(contractAddress: string): Promise<string> {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  try {
    const version = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: AGENT_TOKEN_ABI,
      functionName: 'version'
    });
    return version as string;
  } catch (error) {
    // If version() function doesn't exist, it's V1
    return 'v1';
  }
}

async function getMigrationEligibility(
  userAddress: string,
  v1Contract: string,
  v2Contract: string
): Promise<{
  eligible: boolean;
  v1Balance: string;
  v2Balance: string;
  migrationRatio: string;
  estimatedV2Tokens: string;
}> {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  // Get V1 balance
  const v1Balance = await publicClient.readContract({
    address: v1Contract as `0x${string}`,
    abi: AGENT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`]
  });

  // Get V2 balance (might already have some)
  let v2Balance = 0n;
  try {
    v2Balance = await publicClient.readContract({
      address: v2Contract as `0x${string}`,
      abi: AGENT_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`]
    });
  } catch (error) {
    console.warn('Could not get V2 balance:', error);
  }

  // Get migration details from V2 contract
  let migrationRatio = 1000n; // Default 1:1 ratio
  try {
    const eligibilityInfo = await publicClient.readContract({
      address: v2Contract as `0x${string}`,
      abi: AGENT_TOKEN_ABI,
      functionName: 'getMigrationEligibility',
      args: [userAddress as `0x${string}`]
    });
    
    migrationRatio = eligibilityInfo[2] as bigint;
  } catch (error) {
    console.warn('Could not get migration eligibility:', error);
  }

  const estimatedV2Tokens = (v1Balance * migrationRatio) / 1000n;

  return {
    eligible: v1Balance > 0n,
    v1Balance: formatEther(v1Balance),
    v2Balance: formatEther(v2Balance),
    migrationRatio: migrationRatio.toString(),
    estimatedV2Tokens: formatEther(estimatedV2Tokens)
  };
}

async function performMigration(
  userAddress: string,
  v1Contract: string,
  v2Contract: string
): Promise<string> {
  const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured');
  }

  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  console.log(`Performing migration for user ${userAddress} from ${v1Contract} to ${v2Contract}`);

  // Call the migration function on the V2 contract
  const hash = await walletClient.writeContract({
    address: v2Contract as `0x${string}`,
    abi: AGENT_TOKEN_ABI,
    functionName: 'migrateFromV1',
    args: [v1Contract as `0x${string}`],
    account
  });

  console.log('Migration transaction hash:', hash);
  return hash;
}

async function getMigrationOptions(agentId?: string): Promise<MigrationInfo[]> {
  try {
    let query = supabase
      .from('deployed_contracts')
      .select('*')
      .eq('contract_type', 'agent_token')
      .eq('is_active', true);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data: contracts } = await query;

    if (!contracts) return [];

    // Group by agent_id to find V1/V2 pairs
    const agentGroups: { [agentId: string]: any[] } = {};
    contracts.forEach(contract => {
      if (!agentGroups[contract.agent_id]) {
        agentGroups[contract.agent_id] = [];
      }
      agentGroups[contract.agent_id].push(contract);
    });

    const migrationOptions: MigrationInfo[] = [];

    for (const [agentId, agentContracts] of Object.entries(agentGroups)) {
      const v1Contract = agentContracts.find(c => c.version === 'v1' || !c.version);
      const v2Contract = agentContracts.find(c => c.version === 'v2');

      if (v1Contract && v2Contract) {
        // Get additional info from blockchain
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http()
        });

        try {
          const totalSupply = await publicClient.readContract({
            address: v1Contract.contract_address as `0x${string}`,
            abi: AGENT_TOKEN_ABI,
            functionName: 'totalSupply'
          });

          migrationOptions.push({
            v1Contract: v1Contract.contract_address,
            v2Contract: v2Contract.contract_address,
            agentId: agentId,
            totalV1Supply: totalSupply as bigint,
            totalV1Holders: 0, // Would need to be calculated from events or separate tracking
            migrationRatio: 1000n // Default 1:1, could be retrieved from V2 contract
          });
        } catch (error) {
          console.warn(`Error getting info for agent ${agentId}:`, error);
        }
      }
    }

    return migrationOptions;
  } catch (error) {
    console.error('Error getting migration options:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userAddress, agentId, v1Contract, v2Contract } = await req.json();

    console.log('Migration request:', { action, userAddress, agentId });

    switch (action) {
      case 'get_options':
        const migrationOptions = await getMigrationOptions(agentId);
        return new Response(JSON.stringify({
          success: true,
          migrationOptions
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'check_eligibility':
        if (!userAddress || !v1Contract || !v2Contract) {
          throw new Error('Missing required parameters for eligibility check');
        }

        const eligibility = await getMigrationEligibility(userAddress, v1Contract, v2Contract);
        return new Response(JSON.stringify({
          success: true,
          eligibility
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'migrate':
        if (!userAddress || !v1Contract || !v2Contract) {
          throw new Error('Missing required parameters for migration');
        }

        const migrationTxHash = await performMigration(userAddress, v1Contract, v2Contract);
        return new Response(JSON.stringify({
          success: true,
          transactionHash: migrationTxHash,
          message: 'Migration transaction submitted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('Error in migration function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Migration operation failed',
      details: {
        stack: error.stack,
        name: error.name
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});