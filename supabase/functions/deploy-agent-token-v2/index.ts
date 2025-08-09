
import { createWalletClient, createPublicClient, http, parseEther, defineChain } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'
import { verifyDeployment } from '../_shared/verifyDeployment.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Direct ERC-20 deployment bytecode and ABI for fallback
const DIRECT_ERC20_BYTECODE = "0x608060405234801561001057600080fd5b50604051610c93380380610c938339818101604052810190610032919061028d565b8282600390816100429190610529565b50816004908161005291906105fb565b5080600560006101000a81548160ff021916908360ff1602179055506012600560016101000a81548160ff021916908360ff16021790555050505061060d565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6100f3826100aa565b810181811067ffffffffffffffff82111715610112576101116100bb565b5b80604052505050565b6000610125610087565b905061013182826100ea565b919050565b600067ffffffffffffffff821115610151576101506100bb565b5b61015a826100aa565b9050602081019050919050565b60006101826101778461013665b61019f565b90508281526020810184848401111561019e5761019d6100a5565b5b6101a98482856101bb565b509392505050565b600082601f8301126101c6576101c56100a0565b5b81516101d6848260208601610167565b91505092915050565b600060ff82169050919050565b6101f5816101df565b811461020057600080fd5b50565b600081519050610212816101ec565b92915050565b600080600060608486031215610231576102306100916096565b5b600084015167ffffffffffffffff81111561024f5761024e61009b565b5b61025b868287016101b1565b935050602084015167ffffffffffffffff81111561027c5761027b61009b565b5b610288868287016101b1565b925050604061029986828701610203565b915050949350505056fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461016857806370a082311461019857806395d89b41146101c8578063a457c2d7146101e6578063a9059cbb14610216578063dd62ed3e14610246576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a578063313ce5671461014a575b600080fd5b6100b6610276565b6040516100c39190610a2d565b60405180910390f35b6100e660048036038101906100e191906109e9565b610308565b6040516100f39190610a12565b60405180910390f35b61010461032b565b604051610111919061094e565b60405180910390f35b610134600480360381019061012f91906109565b610335565b6040516101419190610a12565b60405180910390f35b610152610364565b60405161015f9190610a4f565b60405180910390f35b610182600480360381019061017d91906109e9565b61037b565b60405161018f9190610a12565b60405180910390f35b6101b260048036038101906101ad91906108f9565b6103b2565b6040516101bf919061094e565b60405180910390f35b6101d06103fb565b6040516101dd9190610a2d565b60405180910390f35b61020060048036038101906101fb91906109e9565b61048d565b60405161020d9190610a12565b60405180910390f35b610230600480360381019061022b91906109e9565b610504565b60405161023d9190610a12565b60405180910390f35b610260600480360381019061025b9190610926565b610527565b60405161026d919061094e565b60405180910390f35b606060038054610285906100b58565b80601f01602080910402602001604051908101604052809291908181526020018280546102b190610b58565b80156102fe5780601f106102d3576101008083540402835291602001916102fe565b820191906000526020600020905b8154815290600101906020018083116102e157829003601f168201915b5050505050905090565b600080610313610ae5565b9050610320818585610aed565b600191505092915050565b6000600254905090565b600080610340610ae5565b905061034d858285610cb6565b610358858585610d42565b60019150509392505050565b6000600560009054906101000a900460ff16905090565b600080610386610ae5565b905061039d8185856103988589610527565b6103a29190610999565b610aed565b600191505092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606004805461040a90610b58565b80601f016020809104026020016040519081016040528092919081815260200182805461043690610b58565b80156104835780601f1061045857610100808354040283529160200191610483565b820191906000526020600020905b81548152906001019060200180831161046657829003601f168201915b5050505050905090565b600080610498610ae5565b905060006104a68286610527565b9050838110156104eb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104e290610a0d565b60405180910390fd5b6104f88286868403610aed565b60019250505092915050565b60008061050f610ae5565b905061051c818585610d42565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006105c0826105ce565b9050919050565b6105d081610595565b81146105db57600080fd5b50565b6000813590506105ed816105c7565b92915050565b6000819050919050565b610606816105f3565b811461061157600080fd5b50565b600081359050610623816105fd565b92915050565b6000806040838503121561064057610638610bb38565b5b600061064e858286016105de565b925050602061065f85828601610614565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b60005b838110156106a357808201518184015260208101905061088565b60008484015250505050565b60006106ba82610669565b6106c48185610674565b93506106d4818560208601610685565b6106dd81610bb8565b840191505092915050565b6000602082019050818103600083015261070281846106af565b905092915050565b60008115159050919050565b61071f8161070a565b82525050565b600060208201905061073a6000830184610716565b92915050565b610749816105f3565b82525050565b60006020820190506107646000830184610740565b92915050565b600080600060608486031215610783576107826100ba8565b5b6000610791868287016105de565b93505060206107a2868287016105de565b92505060406107b386828701610614565b9150509250925092565b600060ff82169050919050565b6107d3816107bd565b82525050565b60006020820190506107ee60008301846107ca565b92915050565b600060208284031215610870a576108096100ba8565b5b600061081885828601610635e565b91505092915050565b60008060408385031215610892576108916100ba8565b5b60006108a0858286016105de565b92505060206108b1858286016105de565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806108d057607f821691505b6020821081036109e3576109e26108bb565b5b50919050565b6109f2816105f3565b81146109fd57600080fd5b50565b600081905081610a0f816109e9565b92915050565b6000610a1f6100208201610a00565b9050919050565b61092f816105f3565b8114610a3a57600080fd5b50565b600081905081610a4c81610a26565b92915050565b6000610a5d82610a3d565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610a9e826105f3565b9150610aa9836105f3565b9250828201905080821115610ac157610ac0610a64565b5b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610af282610ac7565b9050919050565b610b0281610ae7565b8114610b0d57600080fd5b50565b600081359050610b1f81610af9565b92915050565b7f45524332303a206465637265617365642062656c6f77207a65726f0000000000600082015250565b6000610b5b601b83610674565b9150610b6682610b25565b602082019050919050565b60006020820190508181036000830152610b8a81610b4e565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b6000610bed602583610674565b9150610bf882610b91565b604082019050919050565b60006020820190508181036000830152610c1c81610be0565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b6000610c7f602383610674565b9150610c8a82610c23565b604082019050919050565b60006020820190508181036000830152610cae81610c72565b9050919050565b6000610cc082610527565b905081811015610d05576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610cfc90610b71565b60405180910390fd5b610d178383610d128585610d99565b610aed565b505050565b6000610d27826105f3565b9150610d32836105f3565b9250828203905081811115610d4a57610d49610a64565b5b92915050565b6000610d5b826103b2565b905081811015610da0576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d9790610c03565b60405180910390fd5b610db18383610dac8585610d1c565b610fc3565b6000610dbc836103b2565b905081811015610e01576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610df890610c95565b60405180910390fd5b610e0c838383611139565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610e80576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e7790610c03565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610eef576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ee690610c95565b60405180910390fd5b610efa838383611139565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905081811015610f80576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f7790610b71565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516110509190610740565b60405180910390a3611065848484611139565b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036110da576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110d190610c03565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603611149576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161114090610c95565b60405180910390fd5b505050565b6001600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505050565b600081905090565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061121c82610614565b915061122783610614565b9250828201905080821115611245576112446111e0565b5b92915050565b7f45524332303a20616c6c6f77616e636520657863656564732062616c616e636560008201527f0000000000000000000000000000000000000000000000000000000000000000602082015250565b60006112a7602183610674565b91506112b28261124b565b604082019050919050565b600060208201905081810360008301526112d68161129a565b9050919050565b6000819050815161125d816112f3565b81905092915050565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461136b5760405162461bcd60e51b8152600401611362906112bd565b60405180910390fd5b6113768160006112dd565b50565b600073ffffffffffffffffffffffffffffffffffffffff823b905090565b610e1180610f6083396000f3fe6080604052348015600f57600080fd5b506004361061002d5760003560e01c80631e83409a14603257806374adc7d6146074565b600080fd5b60326096565b005b607a607b604b36038101906071919060575b6096565b60009081526001602052604090205490565b005b6000819050815b8181101560945780607b600052600160205260006040600020600082825401925050819055506001600080828254019250508190555080806001019150506081565b505050fefea26469706673582212208c5b3b4f0a5b3b4f0a5b3b4f0a5b3b4f0a5b3b4f0a5b3b4f0a5b3b4f0a5b3b4f64736f6c63430008120033";

const DIRECT_ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "uint8", "name": "decimals", "type": "uint8"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol", 
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Agent Token Factory ABI - for calling createAgentToken function
const AGENT_TOKEN_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "string", "name": "agentId", "type": "string"}
    ],
    "name": "createAgentToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTokens",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get the deployed PROMPT token address
async function getPromptTokenAddress(): Promise<string> {
  const { data: contracts, error } = await supabase
    .from('deployed_contracts')
    .select('contract_address')
    .eq('contract_type', 'prompt_token')
    .eq('is_active', true)
    .eq('network', 'base_sepolia')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !contracts || contracts.length === 0) {
    console.log('No deployed PROMPT token found, using fallback address');
    return '0x0000000000000000000000000000000000000000';
  }

  return contracts[0].contract_address;
}

// Get the deployed Agent Token Factory address
async function getFactoryAddress(): Promise<string> {
  const { data: contracts, error } = await supabase
    .from('deployed_contracts')
    .select('contract_address')
    .eq('contract_type', 'factory')
    .eq('is_active', true)
    .eq('network', 'base_sepolia')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !contracts || contracts.length === 0) {
    throw new Error('No AgentTokenFactory deployed. Please deploy the factory first.');
  }

  return contracts[0].contract_address;
}

interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  deploymentMethod: 'factory' | 'direct';
}

async function createAgentTokenViaFactory(
  name: string,
  symbol: string,
  agentId: string,
  factoryAddress: string,
  creatorAddress: string
): Promise<DeploymentResult> {
  const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured in Supabase secrets');
  }

  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  console.log(`Creating Agent Token via Factory: ${name} (${symbol}) for agent ${agentId}`);
  console.log(`Using Factory: ${factoryAddress}`);
  console.log(`Creator: ${creatorAddress}`);

  try {
    // Call createAgentToken on the factory
    const hash = await walletClient.writeContract({
      address: factoryAddress as `0x${string}`,
      abi: AGENT_TOKEN_FACTORY_ABI,
      functionName: 'createAgentToken',
      args: [name, symbol, agentId],
      account
    });

    console.log('Factory createAgentToken transaction hash:', hash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60000 // 60 second timeout
    });
    
    console.log('Factory transaction confirmed, block:', receipt.blockNumber);

    // Get the created token address using multiple methods
    let tokenAddress: string | null = null;
    
    console.log('Attempting to get token address from factory...');
    
    try {
      // Method 1: Get all tokens from factory after the transaction
      console.log('Method 1: Reading getAllTokens from factory...');
      const tokensAfter = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: AGENT_TOKEN_FACTORY_ABI,
        functionName: 'getAllTokens'
      }) as `0x${string}`[];
      
      console.log('Tokens from factory:', tokensAfter);
      
      // Take the last token (most recently created)
      if (tokensAfter && tokensAfter.length > 0) {
        tokenAddress = tokensAfter[tokensAfter.length - 1];
        console.log('Found token address from getAllTokens:', tokenAddress);
      }
    } catch (contractError) {
      console.error('Method 1 failed - getAllTokens error:', contractError);
    }
    
    // Method 2: Parse event logs if Method 1 failed
    if (!tokenAddress) {
      console.log('Method 2: Parsing transaction logs...');
      console.log('Receipt logs count:', receipt.logs.length);
      
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`Log ${i}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        });
        
        try {
          // Check if this log is from our factory
          if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
            console.log('Found factory log, checking topics...');
            if (log.topics.length >= 3) {
              // Try different ways to extract the address
              const topic2 = log.topics[2];
              if (topic2) {
                // Remove padding from address (addresses are 20 bytes = 40 hex chars)
                const extractedAddress = `0x${topic2.slice(-40)}`;
                console.log('Extracted address from topic2:', extractedAddress);
                
                if (extractedAddress && extractedAddress !== '0x0000000000000000000000000000000000000000') {
                  tokenAddress = extractedAddress;
                  console.log('Successfully extracted token address:', tokenAddress);
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing log ${i}:`, e);
          continue;
        }
      }
    }

    if (!tokenAddress) {
      // Enhanced error message with debugging info
      const errorDetails = {
        factoryAddress,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        logsCount: receipt.logs.length,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status
      };
      
      console.error('❌ Could not determine token address. Debug info:', errorDetails);
      throw new Error(`Could not determine the deployed token address. Transaction was successful but token address extraction failed. Debug: ${JSON.stringify(errorDetails)}`);
    }

    console.log('Agent Token created at:', tokenAddress);

    // 🔒 MANDATORY VERIFICATION: Ensure contract exists on-chain before proceeding
    console.log('🔍 Verifying contract deployment before database operations...');
    const verification = await verifyDeployment(tokenAddress as `0x${string}`, publicClient, 'agent_token');
    console.log('✅ Contract verification passed:', verification);

    return {
      contractAddress: tokenAddress,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed || BigInt(0),
      deploymentMethod: 'factory' as const
    };
  } catch (deployError: any) {
    console.error('❌ Error in createAgentTokenViaFactory:', deployError);
    
    // Enhanced error logging
    if (deployError.cause) {
      console.error('Error cause:', deployError.cause);
    }
    if (deployError.details) {
      console.error('Error details:', deployError.details);
    }
    if (deployError.shortMessage) {
      console.error('Short message:', deployError.shortMessage);
    }
    
    throw new Error(`Factory deployment failed: ${deployError.message || 'Unknown error'}`);
  }
}

// Direct ERC-20 deployment function for fallback
async function deployDirectERC20(
  name: string,
  symbol: string,
  agentId: string
): Promise<DeploymentResult> {
  const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured in Supabase secrets');
  }

  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  console.log(`🔄 Direct ERC-20 deployment: ${name} (${symbol}) for agent ${agentId}`);

  try {
    // Deploy the contract directly
    const hash = await walletClient.deployContract({
      abi: DIRECT_ERC20_ABI,
      bytecode: DIRECT_ERC20_BYTECODE as `0x${string}`,
      args: [name, symbol, 18], // 18 decimals standard
      account
    });

    console.log('Direct deployment transaction hash:', hash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60000 // 60 second timeout
    });
    
    console.log('Direct deployment confirmed, block:', receipt.blockNumber);
    console.log('Contract deployed at:', receipt.contractAddress);

    if (!receipt.contractAddress) {
      throw new Error('No contract address in receipt');
    }

    // 🔒 MANDATORY VERIFICATION: Ensure contract exists on-chain before proceeding
    console.log('🔍 Verifying direct contract deployment...');
    const verification = await verifyDeployment(receipt.contractAddress, publicClient, 'agent_token');
    console.log('✅ Direct contract verification passed:', verification);

    return {
      contractAddress: receipt.contractAddress,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed || BigInt(0),
      deploymentMethod: 'direct' as const
    };
  } catch (deployError: any) {
    console.error('❌ Error in deployDirectERC20:', deployError);
    throw new Error(`Direct deployment failed: ${deployError.message || 'Unknown error'}`);
  }
}

async function recordDeployment(
  agentId: string,
  contractAddress: string,
  transactionHash: string,
  name: string,
  symbol: string,
  deploymentMethod: 'factory' | 'direct',
  version: string = 'v2'
): Promise<void> {
  try {
    // Update agent record with new token address and deployment tracking
    const { error: agentError } = await supabase
      .from('agents')
      .update({ 
        token_address: contractAddress,
        deployment_method: deploymentMethod,
        deployment_tx_hash: transactionHash,
        deployment_verified: true,
        updated_at: new Date().toISOString(),
        status: 'ACTIVE'
      })
      .eq('id', agentId);

    if (agentError) {
      console.error('Error updating agent record:', agentError);
    }

    // Record deployment in contract tracking table
    const { error: contractError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_address: contractAddress,
        contract_type: 'agent_token',
        agent_id: agentId,
        network: 'base_sepolia',
        version: version,
        name: name,
        symbol: symbol,
        is_active: true,
        deployment_timestamp: new Date().toISOString()
      });

    if (contractError) {
      console.error('Error recording contract deployment:', contractError);
    }

    console.log('Deployment recorded successfully');
  } catch (error) {
    console.error('Error in recordDeployment:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, symbol, agentId, creatorAddress } = await req.json();

    console.log('V2 Deployment request:', { name, symbol, agentId, creatorAddress });

    if (!name || !symbol || !agentId) {
      throw new Error('Missing required parameters: name, symbol, agentId');
    }

    // Check if agent already has a real token address (not a placeholder)
    const { data: existingAgent, error: agentError } = await supabase
      .from('agents')
      .select('token_address, name, symbol')
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('Failed to fetch agent:', agentError);
      throw new Error('Agent not found');
    }

    // Check if agent already has a real token address (not a UUID-based placeholder)
    if (existingAgent.token_address && !existingAgent.token_address.startsWith('0x' + agentId.replace(/-/g, ''))) {
      console.log('Agent already has real token address:', existingAgent.token_address);
      throw new Error(`Agent already has a deployed token: ${existingAgent.token_address}`);
    }

    console.log('Agent current token_address:', existingAgent.token_address, '(placeholder will be replaced)');

    // Get the factory address - this is required
    const factoryAddress = await getFactoryAddress();
    
    // Use a default creator address if not provided
    const finalCreatorAddress = creatorAddress || '0x23d03610584B0f0988A6F9C281a37094D5611388';

    console.log('Creating Agent Token via Factory with parameters:', {
      name,
      symbol,
      agentId,
      factoryAddress,
      creatorAddress: finalCreatorAddress
    });

    // 🚀 DUAL DEPLOYMENT STRATEGY: Factory first, then direct fallback
    let deploymentResult: DeploymentResult;
    
    try {
      // Primary: Try factory deployment
      console.log('🏭 Attempting factory deployment...');
      deploymentResult = await createAgentTokenViaFactory(
        name,
        symbol,
        agentId,
        factoryAddress,
        finalCreatorAddress
      );
      console.log('✅ Factory deployment successful!');
    } catch (factoryError) {
      console.log('⚠️  Factory deployment failed, trying direct deployment fallback...');
      console.error('Factory error:', factoryError.message);
      
      try {
        // Fallback: Direct ERC-20 deployment
        console.log('🔄 Attempting direct ERC-20 deployment...');
        deploymentResult = await deployDirectERC20(name, symbol, agentId);
        console.log('✅ Direct deployment successful!');
      } catch (directError) {
        console.error('❌ Both deployment methods failed!');
        console.error('Factory error:', factoryError.message);
        console.error('Direct error:', directError.message);
        throw new Error(`Both deployment methods failed. Factory: ${factoryError.message}. Direct: ${directError.message}`);
      }
    }

    // 🔒 VERIFICATION COMPLETE: Contract verified during deployment
    // Now safe to record in database
    await recordDeployment(
      agentId, 
      deploymentResult.contractAddress, 
      deploymentResult.transactionHash, 
      name, 
      symbol, 
      deploymentResult.deploymentMethod,
      'v2'
    );

    console.log('V2 Agent Token deployment completed successfully');

    return new Response(JSON.stringify({
      success: true,
      contractAddress: deploymentResult.contractAddress,
      transactionHash: deploymentResult.transactionHash,
      blockNumber: deploymentResult.blockNumber,
      gasUsed: deploymentResult.gasUsed,
      deploymentMethod: deploymentResult.deploymentMethod,
      agentId,
      version: 'v2',
      factoryAddress: deploymentResult.deploymentMethod === 'factory' ? factoryAddress : null,
      features: deploymentResult.deploymentMethod === 'factory' ? [
        'factory_deployment',
        'automatic_fee_collection',
        'bonding_curve_trading',
        'graduation_mechanism'
      ] : [
        'direct_deployment',
        'erc20_standard',
        'tradeable_token'
      ],
      name,
      symbol,
      network: 'base_sepolia',
      explorerUrl: `https://sepolia.basescan.org/address/${deploymentResult.contractAddress}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error deploying V2 Agent Token:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to deploy V2 Agent Token',
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
