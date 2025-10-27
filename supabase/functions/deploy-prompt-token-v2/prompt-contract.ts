// PROMPT Test Token Contract Data
// Generated from: PromptTestToken.sol (Solidity 0.8.20, optimization: 200 runs)
// Symbol: PROMPT | Initial Supply: 1,000,000 | Faucet: 1000 per claim | Cooldown: 1 hour

export const PROMPT_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "FAUCET_AMOUNT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FAUCET_COOLDOWN",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "INITIAL_SUPPLY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "lastFaucetClaim",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const PROMPT_TOKEN_BYTECODE = '0x608060405234801561000f575f80fd5b50336040518060400160405280601181526020017f50726f6d707420546573742546f6b656e0000000000000000000000000000008152506040518060400160405280600681526020017f50524f4d50540000000000000000000000000000000000000000000000000000815250816003908161008c919061061f565b50806004908161009c919061061f565b5050505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361010f575f6040517f1e4fbdf70000000000000000000000000000000000000000000000000000000081526004016101069190610727565b60405180910390fd5b61011e8161012f60201b60201c565b5061012d336b033b2e3c9fd0803ce800000061000202565b565b5f60055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508160055f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610265575f6040517fec442f0500000000000000000000000000000000000000000000000000000000815260040161025c9190610727565b60405180910390fd5b6102755f838361027960201b60201c565b5050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036102c9578060025f8282546102bd91906107a3565b9250508190555061039b565b5f805f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905081811015610354578381836040517fe450d38c00000000000000000000000000000000000000000000000000000000815260040161034b939291906107d6565b60405180910390fd5b8181035f808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036103e2578060025f8282540392505081905550610430565b805f808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161048d919061080b565b60405180910390a3505050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061051557607f821691505b602082108103610528576105276104d1565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026105887fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261054d565b610592868361054d565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f6105d66105d16105cc846105aa565b6105b3565b6105aa565b9050919050565b5f819050919050565b6105ef836105bc565b6106036105fb826105dd565b848454610559565b825550505050565b5f90565b61061761060b565b6106228184846105e6565b505050565b5b818110156106455761063a5f8261060f565b600181019050610628565b5050565b601f82111561068a5761065b8161052e565b61066484610540565b81016020851015610673578190505b61068761067f85610540565b830182610627565b50505b505050565b5f82821c905092915050565b5f6106aa5f198460080261068f565b1980831691505092915050565b5f6106c2838361069b565b9150826002028217905092915050565b6106db8261049a565b67ffffffffffffffff8111156106f4576106f36104a4565b5b6106fe82546104fe565b610709828285610649565b5f60209050601f83116001811461073a575f8415610728578287015190505b61073285826106b7565b865550610799565b601f1984166107488661052e565b5f5b8281101561076f5784890151825560018201915060208501945060208101905061074a565b8683101561078c5784890151610788601f89168261069b565b8355505b6001600288020188555050505b505050505050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6107cb826107a1565b9050919050565b6107db816107c1565b82525050565b5f6060820190506107f45f8301866107d2565b610801602083018561080b565b61080e604083018461080b565b949350505050565b5f602082019050610829838301846107d2565b92915050565b5f6108398261049a565b61084381856108aa565b9350610853818560208601610540565b61085c816104a4565b840191505092915050565b5f61087182610838565b915061087d818461054d565b915081905092915050565b5f819050919050565b5f6108a56108a061089b84610888565b6105b3565b6105aa565b9050919050565b6108b58161088b565b82525050565b5f6060820190506108ce838301866108ac565b6108db602083018561080b565b6108e8604083018461080b565b949350505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610928826105aa565b9150610933836105aa565b925082820190508082111561094b5761094a6108f0565b5b92915050565b5f61095b826105aa565b9150610966836105aa565b9250828203905081811115610980576109816108f0565b5b92915050565b5f602082019050610999838301846108ac565b92915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6109c88261099f565b9050919050565b6109d8816109be565b82525050565b5f6040820190506109f15f8301856109cf565b6109fe602083018461080b565b9392505050565b610a0e816109be565b8114610a18575f80fd5b50565b5f81519050610a2981610a05565b92915050565b5f60208284031215610a4457610a436104a0565b5b5f610a5184828501610a1b565b91505092915050565b610a6381610888565b8114610a6d575f80fd5b50565b5f81519050610a7e81610a5a565b92915050565b5f60208284031215610a9957610a986104a0565b5b5f610aa684828501610a70565b91505092915050565b610ab8816105aa565b8114610ac2575f80fd5b50565b5f81519050610ad381610aaf565b92915050565b5f60208284031215610aee57610aed6104a0565b5b5f610afb84828501610ac5565b91505092915050565b610b0d816109be565b82525050565b5f606082019050610b265f830186610b04565b610b336020830185610b04565b610b40604083018461080b565b949350505050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610b7182610b48565b9050919050565b610b8181610b67565b8114610b8b575f80fd5b50565b5f81519050610b9c81610b78565b92915050565b5f60208284031215610bb757610bb66104a0565b5b5f610bc484828501610b8e565b91505092915050565b610bd6816107c1565b8114610be0575f80fd5b50565b5f81519050610bf181610bcd565b92915050565b5f60208284031215610c0c57610c0b6104a0565b5b5f610c1984828501610be3565b91505092915050565b5f819050919050565b5f610c45610c40610c3b84610c22565b6105b3565b6105aa565b9050919050565b610c5581610c2b565b82525050565b5f608082019050610c6e5f830187610c4c565b610c7b602083018661080b565b610c88604083018561080b565b610c95606083018461080b565b95945050505050565b5f610ca882610838565b9150610cb4818461054d565b915081905092915050565b5f6040820190508181035f830152610cd7818561082f565b9050610ce6602083018461080b565b9392505050565b5f610cf8828461054d565b915081905092915050565b5f610d0d826109be565b9050919050565b610d1d81610d03565b8114610d27575f80fd5b50565b5f81519050610d3881610d14565b92915050565b5f60208284031215610d5357610d526104a0565b5b5f610d6084828501610d2a565b91505092915050565b5f602082019050610d7c5f830184610b04565b92915050565b5f608082019050610d955f830187610b04565b610da2602083018661080b565b610daf604083018561080b565b610dbc606083018461080b565b95945050505050565b5f610dcf826107a1565b9050919050565b610ddf81610dc5565b8114610de9575f80fd5b50565b5f81519050610dfa81610dd6565b92915050565b5f60208284031215610e1557610e146104a0565b5b5f610e2284828501610dec565b91505092915050565b5f819050919050565b5f610e4e610e49610e4484610e2b565b6105b3565b6105aa565b9050919050565b610e5e81610e34565b82525050565b5f608082019050610e775f830187610e55565b610e84602083018661080b565b610e91604083018561080b565b610e9e606083018461080b565b95945050505050565b610eb081610c22565b8114610eba575f80fd5b50565b5f81519050610ecb81610ea7565b92915050565b5f60208284031215610ee657610ee56104a0565b5b5f610ef384828501610ebd565b91505092915050565b5f608082019050610f0f5f830187610c4c565b610f1c602083018661080b565b610f29604083018561080b565b610f36606083018461080b565b95945050505050565b610f4881610e2b565b8114610f52575f80fd5b50565b5f81519050610f6381610f3f565b92915050565b5f60208284031215610f7e57610f7d6104a0565b5b5f610f8b84828501610f55565b91505092915050565b610f9d816107c1565b82525050565b5f606082019050610fb65f830186610f94565b610fc3602083018561080b565b610fd0604083018461080b565b949350505050565b5f610fe282610838565b9150610fee818461054d565b915081905092915050565b5f60608201905061100c5f830186610c4c565b611019602083018561080b565b611026604083018461080b565b949350505050565b5f819050919050565b5f6110516110' as const;
