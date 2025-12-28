import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin wallets allowed to deploy V6 contracts
const ADMIN_WALLETS = [
  '0x23d03610584B0f0988A6F9C281a37094D5611388'.toLowerCase(), // Primary deployer
];

// Network configuration
const NETWORK_CONFIG: Record<number, {
  name: string;
  rpcEnv: string;
  promptToken: string;
  vault: string;
  uniswapFactory: string;
  uniswapRouter: string;
  blockExplorer: string;
}> = {
  84532: {
    name: 'base_sepolia',
    rpcEnv: 'PRIMARY_RPC_URL',
    promptToken: '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673',
    vault: '0xBaFe4E2C27f1c0bb8e562262Dd54E3F1BB959140',
    uniswapFactory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    uniswapRouter: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    blockExplorer: 'https://sepolia.basescan.org',
  },
  8453: {
    name: 'base_mainnet',
    rpcEnv: 'BASE_MAINNET_RPC_URL',
    promptToken: '0x0000000000000000000000000000000000000000',
    vault: '0x0000000000000000000000000000000000000000',
    uniswapFactory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    uniswapRouter: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    blockExplorer: 'https://basescan.org',
  },
};

// Contract deployment order types
const CONTRACT_TYPES = [
  'RewardDistributor_V6',
  'TeamVesting_V6', 
  'LPLocker_V6',
  'GraduationManager_V6',
  'AgentFactory_V6',
] as const;

type ContractType = typeof CONTRACT_TYPES[number];

// Bytecode file names in storage bucket (must match exact uploaded filenames)
const BYTECODE_FILES: Record<string, string> = {
  'RewardDistributor': 'bytecode_RewardDistributor.txt',
  'TeamVesting': 'bytecode_TeamVesting.txt',
  'LPLocker': 'bytecode_LPLocker.txt',
  'GraduationManager': 'bytecode_GraduationManagerV6.txt',
  'AgentFactory': 'bytecode_AgentFactoryV6.txt',
};

// Ownable ABI for ownership transfer
const OWNABLE_ABI = [
  'function transferOwnership(address newOwner) external',
  'function owner() external view returns (address)',
];

// Deployment step type
interface DeploymentStep {
  step: number;
  name: string;
  status: 'pending' | 'deploying' | 'completed' | 'skipped' | 'failed';
  contractType: ContractType | 'ownership_transfer_1' | 'ownership_transfer_2';
  address?: string;
  txHash?: string;
  error?: string;
}

// Fetch bytecode from Supabase Storage
async function fetchBytecode(supabase: SupabaseClient, contractName: string): Promise<string> {
  const fileName = BYTECODE_FILES[contractName];
  if (!fileName) {
    throw new Error(`Unknown contract: ${contractName}`);
  }

  console.log(`[deploy-v6-contracts] Fetching bytecode for ${contractName}: ${fileName}`);

  const { data, error } = await supabase.storage
    .from('contract-bytecode')
    .download(fileName);

  if (error || !data) {
    throw new Error(`Failed to fetch bytecode for ${contractName} (${fileName}): ${error?.message || 'No data'}`);
  }

  const bytecode = (await data.text()).trim();

  if (!/^0x[0-9a-fA-F]+$/.test(bytecode)) {
    throw new Error(`Invalid bytecode format for ${contractName}. Must be 0x followed by hex only.`);
  }

  console.log(`[deploy-v6-contracts] ✅ Loaded ${contractName} bytecode (${bytecode.length} chars)`);
  return bytecode;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { chainId, adminWallet, signature, message } = await req.json();

    console.log('[deploy-v6-contracts] Starting deployment for chain:', chainId);

    // ==== STEP 1: Verify admin signature ====
    if (!signature || !message || !adminWallet) {
      return new Response(
        JSON.stringify({ error: 'Missing signature, message, or adminWallet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the signature matches the claimed admin wallet
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log('[deploy-v6-contracts] Recovered address:', recoveredAddress);
    console.log('[deploy-v6-contracts] Claimed admin wallet:', adminWallet);

    if (recoveredAddress.toLowerCase() !== adminWallet.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Signature verification failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the recovered address is in admin list
    if (!ADMIN_WALLETS.includes(recoveredAddress.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Wallet not authorized for V6 deployment' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==== STEP 2: Get network configuration ====
    const networkConfig = NETWORK_CONFIG[chainId];
    if (!networkConfig) {
      return new Response(
        JSON.stringify({ error: `Unsupported chain ID: ${chainId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rpcUrl = Deno.env.get(networkConfig.rpcEnv);
    const privateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');

    if (!rpcUrl || !privateKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing deployment configuration',
          missing: {
            rpcUrl: !rpcUrl ? networkConfig.rpcEnv : null,
            privateKey: !privateKey ? 'DEPLOYER_PRIVATE_KEY' : null,
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==== STEP 3: Fetch all bytecodes from storage ====
    console.log('[deploy-v6-contracts] Fetching bytecodes from Supabase Storage...');
    
    const bytecodes: Record<string, string> = {};
    const bytecodeNames = ['RewardDistributor', 'TeamVesting', 'LPLocker', 'GraduationManager', 'AgentFactory'];
    
    for (const name of bytecodeNames) {
      try {
        bytecodes[name] = await fetchBytecode(supabase, name);
      } catch (bytecodeError) {
        const err = bytecodeError as Error;
        console.error(`[deploy-v6-contracts] Failed to fetch bytecode for ${name}:`, err.message);
        return new Response(
          JSON.stringify({ 
            error: `Failed to fetch bytecode for ${name}`,
            details: err.message,
            hint: `Please upload ${BYTECODE_FILES[name]} to the 'contract-bytecode' storage bucket`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[deploy-v6-contracts] All bytecodes loaded successfully');

    // ==== STEP 4: Check for already deployed contracts (resume capability) ====
    const { data: existingContracts } = await supabase
      .from('deployed_contracts')
      .select('contract_type, contract_address, transaction_hash')
      .eq('version', 'v6')
      .eq('network', networkConfig.name)
      .eq('is_active', true);

    const deployedMap = new Map<string, { address: string; txHash: string }>(
      (existingContracts || []).map((c) => [
        c.contract_type,
        { address: c.contract_address, txHash: c.transaction_hash },
      ])
    );

    console.log('[deploy-v6-contracts] Already deployed:', Array.from(deployedMap.keys()));

    // ==== STEP 5: Setup provider and wallet ====
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('[deploy-v6-contracts] Deployer address:', wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('[deploy-v6-contracts] Deployer balance:', ethers.formatEther(balance), 'ETH');

    if (balance < ethers.parseEther('0.01')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient ETH balance for deployment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==== STEP 6: Deploy contracts in order ====
    const steps: DeploymentStep[] = [
      { step: 1, name: 'RewardDistributor', status: 'pending', contractType: 'RewardDistributor_V6' },
      { step: 2, name: 'TeamVesting', status: 'pending', contractType: 'TeamVesting_V6' },
      { step: 3, name: 'LPLocker', status: 'pending', contractType: 'LPLocker_V6' },
      { step: 4, name: 'GraduationManager', status: 'pending', contractType: 'GraduationManager_V6' },
      { step: 5, name: 'Transfer RewardDistributor ownership', status: 'pending', contractType: 'ownership_transfer_1' },
      { step: 6, name: 'Transfer TeamVesting ownership', status: 'pending', contractType: 'ownership_transfer_2' },
      { step: 7, name: 'AgentFactory', status: 'pending', contractType: 'AgentFactory_V6' },
    ];

    const addresses: Record<string, string> = {};

    // Helper to deploy a contract with constructor args encoded into bytecode
    async function deployContract(bytecode: string, constructorTypes: string[] = [], constructorArgs: unknown[] = []): Promise<{ address: string; txHash: string }> {
      let deployBytecode = bytecode;
      
      // If constructor args are provided, encode and append them
      if (constructorTypes.length > 0 && constructorArgs.length > 0) {
        const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(constructorTypes, constructorArgs).slice(2);
        deployBytecode = bytecode + encodedArgs;
      }
      
      const factory = new ethers.ContractFactory([], deployBytecode, wallet);
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      const deployTx = contract.deploymentTransaction();
      return { address, txHash: deployTx?.hash || '' };
    }

    // Helper to save to database
    async function saveContract(contractType: string, address: string, txHash: string) {
      await supabase.from('deployed_contracts').upsert({
        contract_address: address,
        contract_type: contractType,
        version: 'v6',
        network: networkConfig.name,
        transaction_hash: txHash,
        is_active: true,
        deployed_by: wallet.address,
        created_at: new Date().toISOString(),
      }, { onConflict: 'contract_type,version,network' });
    }

    try {
      // Step 1: Deploy RewardDistributor
      if (deployedMap.has('RewardDistributor_V6')) {
        steps[0].status = 'skipped';
        steps[0].address = deployedMap.get('RewardDistributor_V6')!.address;
        addresses.rewardDistributor = steps[0].address!;
        console.log('[deploy-v6-contracts] Skipping RewardDistributor (already deployed)');
      } else {
        steps[0].status = 'deploying';
        console.log('[deploy-v6-contracts] Deploying RewardDistributor with owner:', wallet.address);
        // RewardDistributor constructor takes initialOwner address
        const result = await deployContract(
          bytecodes['RewardDistributor'],
          ['address'],
          [wallet.address]
        );
        steps[0].address = result.address;
        steps[0].txHash = result.txHash;
        steps[0].status = 'completed';
        addresses.rewardDistributor = result.address;
        await saveContract('RewardDistributor_V6', result.address, result.txHash);
        console.log('[deploy-v6-contracts] RewardDistributor deployed:', result.address);
      }

      // Step 2: Deploy TeamVesting
      if (deployedMap.has('TeamVesting_V6')) {
        steps[1].status = 'skipped';
        steps[1].address = deployedMap.get('TeamVesting_V6')!.address;
        addresses.teamVesting = steps[1].address!;
        console.log('[deploy-v6-contracts] Skipping TeamVesting (already deployed)');
      } else {
        steps[1].status = 'deploying';
        console.log('[deploy-v6-contracts] Deploying TeamVesting with owner:', wallet.address);
        // TeamVesting constructor takes initialOwner address
        const result = await deployContract(
          bytecodes['TeamVesting'],
          ['address'],
          [wallet.address]
        );
        steps[1].address = result.address;
        steps[1].txHash = result.txHash;
        steps[1].status = 'completed';
        addresses.teamVesting = result.address;
        await saveContract('TeamVesting_V6', result.address, result.txHash);
        console.log('[deploy-v6-contracts] TeamVesting deployed:', result.address);
      }

      // Step 3: Deploy LPLocker
      if (deployedMap.has('LPLocker_V6')) {
        steps[2].status = 'skipped';
        steps[2].address = deployedMap.get('LPLocker_V6')!.address;
        addresses.lpLocker = steps[2].address!;
        console.log('[deploy-v6-contracts] Skipping LPLocker (already deployed)');
      } else {
        steps[2].status = 'deploying';
        console.log('[deploy-v6-contracts] Deploying LPLocker with owner:', wallet.address);
        // LPLocker constructor takes initialOwner address
        const result = await deployContract(
          bytecodes['LPLocker'],
          ['address'],
          [wallet.address]
        );
        steps[2].address = result.address;
        steps[2].txHash = result.txHash;
        steps[2].status = 'completed';
        addresses.lpLocker = result.address;
        await saveContract('LPLocker_V6', result.address, result.txHash);
        console.log('[deploy-v6-contracts] LPLocker deployed:', result.address);
      }

      // Step 4: Deploy GraduationManager (needs all infrastructure addresses)
      if (deployedMap.has('GraduationManager_V6')) {
        steps[3].status = 'skipped';
        steps[3].address = deployedMap.get('GraduationManager_V6')!.address;
        addresses.graduationManager = steps[3].address!;
        console.log('[deploy-v6-contracts] Skipping GraduationManager (already deployed)');
      } else {
        steps[3].status = 'deploying';
        console.log('[deploy-v6-contracts] Deploying GraduationManager...');
        
        // GraduationManagerV6 constructor:
        // (promptToken, vault, uniswapFactory, uniswapRouter, rewardDistributor, teamVesting, lpLocker)
        const result = await deployContract(
          bytecodes['GraduationManager'],
          ['address', 'address', 'address', 'address', 'address', 'address', 'address'],
          [
            networkConfig.promptToken,
            networkConfig.vault,
            networkConfig.uniswapFactory,
            networkConfig.uniswapRouter,
            addresses.rewardDistributor,
            addresses.teamVesting,
            addresses.lpLocker,
          ]
        );
        
        steps[3].address = result.address;
        steps[3].txHash = result.txHash;
        steps[3].status = 'completed';
        addresses.graduationManager = result.address;
        await saveContract('GraduationManager_V6', result.address, result.txHash);
        console.log('[deploy-v6-contracts] GraduationManager deployed:', result.address);
      }

      // Step 5: Transfer RewardDistributor ownership to GraduationManager
      steps[4].status = 'deploying';
      console.log('[deploy-v6-contracts] Transferring RewardDistributor ownership...');
      try {
        const rewardDistributor = new ethers.Contract(addresses.rewardDistributor, OWNABLE_ABI, wallet);
        const currentOwner = await rewardDistributor.owner();
        if (currentOwner.toLowerCase() === addresses.graduationManager.toLowerCase()) {
          steps[4].status = 'skipped';
          console.log('[deploy-v6-contracts] RewardDistributor ownership already transferred');
        } else {
          const tx = await rewardDistributor.transferOwnership(addresses.graduationManager);
          await tx.wait();
          steps[4].txHash = tx.hash;
          steps[4].status = 'completed';
          console.log('[deploy-v6-contracts] RewardDistributor ownership transferred');
        }
      } catch (err) {
        console.log('[deploy-v6-contracts] RewardDistributor ownership transfer skipped (may already be done)');
        steps[4].status = 'skipped';
      }

      // Step 6: Transfer TeamVesting ownership to GraduationManager
      steps[5].status = 'deploying';
      console.log('[deploy-v6-contracts] Transferring TeamVesting ownership...');
      try {
        const teamVesting = new ethers.Contract(addresses.teamVesting, OWNABLE_ABI, wallet);
        const currentOwner = await teamVesting.owner();
        if (currentOwner.toLowerCase() === addresses.graduationManager.toLowerCase()) {
          steps[5].status = 'skipped';
          console.log('[deploy-v6-contracts] TeamVesting ownership already transferred');
        } else {
          const tx = await teamVesting.transferOwnership(addresses.graduationManager);
          await tx.wait();
          steps[5].txHash = tx.hash;
          steps[5].status = 'completed';
          console.log('[deploy-v6-contracts] TeamVesting ownership transferred');
        }
      } catch (err) {
        console.log('[deploy-v6-contracts] TeamVesting ownership transfer skipped (may already be done)');
        steps[5].status = 'skipped';
      }

      // Step 7: Deploy AgentFactory
      if (deployedMap.has('AgentFactory_V6')) {
        steps[6].status = 'skipped';
        steps[6].address = deployedMap.get('AgentFactory_V6')!.address;
        addresses.agentFactory = steps[6].address!;
        console.log('[deploy-v6-contracts] Skipping AgentFactory (already deployed)');
      } else {
        steps[6].status = 'deploying';
        console.log('[deploy-v6-contracts] Deploying AgentFactory...');
        
        // AgentFactoryV6 constructor: (promptToken, vault, graduationManager)
        const result = await deployContract(
          bytecodes['AgentFactory'],
          ['address', 'address', 'address'],
          [networkConfig.promptToken, networkConfig.vault, addresses.graduationManager]
        );
        
        steps[6].address = result.address;
        steps[6].txHash = result.txHash;
        steps[6].status = 'completed';
        addresses.agentFactory = result.address;
        await saveContract('AgentFactory_V6', result.address, result.txHash);
        console.log('[deploy-v6-contracts] AgentFactory deployed:', result.address);
      }

      console.log('[deploy-v6-contracts] All V6 contracts deployed successfully!');

      return new Response(
        JSON.stringify({
          success: true,
          chainId,
          network: networkConfig.name,
          blockExplorer: networkConfig.blockExplorer,
          steps,
          addresses: {
            rewardDistributor: addresses.rewardDistributor,
            teamVesting: addresses.teamVesting,
            lpLocker: addresses.lpLocker,
            graduationManager: addresses.graduationManager,
            agentFactory: addresses.agentFactory,
            promptToken: networkConfig.promptToken,
            vault: networkConfig.vault,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (deployError: unknown) {
      const error = deployError as Error;
      console.error('[deploy-v6-contracts] Deployment error:', error);

      // Find the failed step and mark it
      const failedStepIndex = steps.findIndex(s => s.status === 'deploying');
      if (failedStepIndex >= 0) {
        steps[failedStepIndex].status = 'failed';
        steps[failedStepIndex].error = error.message;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          steps,
          addresses,
          resumable: true,
          message: 'Deployment failed but can be resumed. Already deployed contracts are saved.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[deploy-v6-contracts] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
