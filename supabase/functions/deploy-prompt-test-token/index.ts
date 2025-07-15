import { createPublicClient, createWalletClient, http, parseEther } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Working ERC20 token bytecode 
const PROMPTTEST_BYTECODE = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506b033b2e3c9fd0803ce8000000600181905550600154600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055503373ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef6001546040516101279190610228565b60405180910390a361023e565b6000819050919050565b61014881610135565b82525050565b6000602082019050610163600083018461013f565b92915050565b610a52806101786000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce567146101395780636fdde031461015757806370a082311461017557806395d89b41146101a5578063a9059cbb146101c357610093565b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100e657806323b872dd14610104575b600080fd5b6100a06101f3565b6040516100ad9190610747565b60405180910390f35b6100d060048036038101906100cb91906107d0565b61022c565b6040516100dd919061082b565b60405180910390f35b6100ee61031e565b6040516100fb9190610855565b60405180910390f35b61011e60048036038101906101199190610870565b610324565b60405161013093929190610892565b60405180910390f35b610141610520565b60405161014e91906108de565b60405180910390f35b61015f610525565b60405161016c9190610747565b60405180910390f35b61018f600480360381019061018a91906108f9565b61055e565b60405161019c9190610855565b60405180910390f35b6101ad6105a6565b6040516101ba9190610747565b60405180910390f35b6101dd60048036038101906101d891906107d0565b6105df565b6040516101ea919061082b565b60405180910390f35b60606040518060400160405280601181526020017f50726f6d70742054657374546f6b656e000000000000000000000000000000008152509050919050565b600081600360003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610302919061095f565b60405180910390a36001905092915050565b60015481565b600080600080600360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905084811015610e2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103e2906109e6565b60405180910390fd5b84600260008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561046e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161046590610a52565b60405180910390fd5b8481610478919061097f565b600360008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555061050386868661072c565b600194505050509392505050565b601290565b60606040518060400160405280600b81526020017f50524f4d5054544553540000000000000000000000000000000000000000000008152509050919050565b6000600260008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606040518060400160405280600b81526020017f50524f4d5054544553540000000000000000000000000000000000000000000008152509050919050565b60006105ec338484610728565b905092915050565b600082600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561067c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161067390610a52565b60405180910390fd5b81600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546106c191906109b3565b9250508190555081600260008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610716919061097f565b925050819055506001915050929190565b600081905092915050565b6000610739848484610658565b905093929192565b600081519050919050565b600082825260208201905092915050565b60005b8381101561077c578082015181840152602081019050610761565b60008484015250505050565b6000601f19601f8301169050919050565b60006107a48261073c565b6107ae818561074c565b93506107be81856020860161075f565b6107c781610788565b840191505092915050565b600080604083850312156107e9576107e8610a72565b5b60006107f785828601610a84565b92505060206108088582860161096b565b9150509250929050565b60008115159050919050565b61082781610812565b82525050565b6000602082019050610842600083018461081e565b92915050565b6000819050919050565b61085b81610848565b82525050565b60006020820190506108766000830184610852565b92915050565b61088581610848565b811461089057600080fd5b50565b600060608201905061089160008301866108a1565b6108406020830185610856565b6108476040830184610856565b94935050505056fea2646970667358221220a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789ab064736f6c63430008170033"

const PROMPTTEST_ABI = [
  {
    "inputs": [],
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
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

Deno.serve(async (req) => {
  console.log('Deploy PROMPTTEST Token function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the deployer's private key from environment
    const privateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not found in environment variables');
    }

    console.log('Creating account and clients...');

    // Create account from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('Deployer account:', account.address);

    // Create public client for reading from the blockchain
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    // Create wallet client for deploying contracts
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });

    console.log('Deploying PROMPTTEST token...');

    // Deploy the token contract (no constructor arguments needed)
    const hash = await walletClient.deployContract({
      abi: PROMPTTEST_ABI,
      bytecode: PROMPTTEST_BYTECODE as `0x${string}`
    });

    console.log('Deployment transaction sent, hash:', hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log('Transaction mined in block:', receipt.blockNumber);
    console.log('Contract deployed at:', receipt.contractAddress);

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress: receipt.contractAddress,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error deploying PROMPTTEST token:', error);
    
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