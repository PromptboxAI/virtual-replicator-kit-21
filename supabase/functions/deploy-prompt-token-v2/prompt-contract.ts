// PROMPT Test Token Contract Data
// Generated from: PromptTestToken.sol (Solidity 0.8.20, optimization: 200 runs)
// Symbol: PROMPT | Initial Supply: 1,000,000 | Faucet: 1000 per claim | Cooldown: 1 hour

export const PROMPT_TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
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

// Split into chunks to prevent editor truncation
export const PROMPT_TOKEN_BYTECODE = 
  '0x60806040523480156200001157600080fd5b5060405162000d6038038062000d608339810160408190526200003491620001b1565b3382826003620000458382620002aa565b506004620000548282620002aa565b5050506001600160a01b0381166200008657604051631e4fbdf760e01b81526000600482015260240160405180910390fd5b62000091816200009a565b50505062000376565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200011457600080fd5b81516001600160401b0380821115620001315762000131620000ec565b604051601f8301601f19908116603f011681019082821181831017156200015c576200015c620000ec565b816040528381526020925086838588010111156200017957600080fd5b600091505b838210156200019d57858201830151818301840152908201906200017e565b600093810190920192909252949350505050565b60008060408385031215620001c557600080fd5b82516001600160401b0380821115620001dd57600080fd5b620001eb8683870162000102565b935060208501519150808211156200020257600080fd5b50620002118582860162000102565b9150509250929050565b600181811c908216806200023057607f821691505b6020821081036200025157634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620002a557600081815260208120601f850160051c81016020861015620002805750805b601f850160051c820191505b81811015620002a1578281556001016200028c565b5050505b505050565b81516001600160401b03811115620002c657620002c6620000ec565b620002de81620002d784546200021b565b8462000257565b602080601f831160018114620003165760008415620002fd5750858301515b600019600386901b1c1916600185901b178555620002a1565b600085815260208120601f198616915b82811015620003475788860151825594840194600190910190840162000326565b5085821015620003665787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b6109da80620003866000396000f3fe608060405234801561001057600080fd5b506004361061010b5760003560e01c8063715018a6116100a2578063a2724a4d11610071578063a2724a4d1461021e578063a9059cbb14610228578063dd62ed3e1461023b578063de5f72fd14610274578063f2fde38b1461027c57600080fd5b8063715018a6146101e357806376697640146101eb5780638da5cb5b146101fb57806395d89b411461021657600080fd5b8063313ce567116100de578063313ce5671461017657806340c10f19146101855780635c16e15e1461019a57806370a08231146101ba57600080fd5b806306fdde0314610110578063095ea7b31461012e57806318160ddd1461015157806323b872dd14610163575b600080fd5b61011861028f565b6040516101259190610809565b60405180910390f35b61014161013c366004610873565b610321565b6040519015158152602001610125565b6002545b604051908152602001610125565b61014161017136600461089d565b61033b565b60405160128152602001610125565b610198610193366004610873565b61035f565b005b6101556101a83660046108d9565b60066020526000908152604090205481565b6101556101c83660046108d9565b6001600160a01b031660009081526020819052604090205490565b610198610375565b610155683635c9adc5dea0000081565b6005546040516001600160a01b039091168152602001610125565b610118610389565b6101556201518081565b610141610236366004610873565b610398565b6101556102493660046108fb565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6101986103a6565b61019861028a3660046108d9565b610428565b60606003805461029e9061092e565b80601f01602080910402602001604051908101604052809291908181526020018280546102ca9061092e565b80156103175780601f106102ec57610100808354040283529160200191610317565b820191906000526020600020905b8154815290600101906020018083116102fa57829003601f168201915b5050505050905090565b60003361032f818585610466565b60019150505b92915050565b600033610349858285610478565b6103548585856104f6565b506001949350505050565b610367610555565b6103718282610582565b5050565b61037d610555565b61038760006105b8565b565b60606004805461029e9061092e565b60003361032f8185856104f6565b3360009081526006602052604090205462015180906103c5904261097e565b10156104035760405162461bcd60e51b81526020600482015260086024820152670aec2d2e8406468d60c31b60448201526064015b60405180910390fd5b33600081815260066020526040902042905561038790683635c9adc5dea00000610582565b610430610555565b6001600160a01b03811661045a57604051631e4fbdf760e01b8152600060048201526024016103fa565b610463816105b8565b50565b610473838383600161060a565b505050565b6001600160a01b0383811660009081526001602090815260408083209386168352929052205460001981146104f057818110156104e157604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064016103fa565b6104f08484848403600061060a565b50505050565b6001600160a01b03831661052057604051634b637e8f60e11b8152600060048201526024016103fa565b6001600160a01b03821661054a5760405163ec442f0560e01b8152600060048201526024016103fa565b6104738383836106df565b6005546001600160a01b031633146103875760405163118cdaa760e01b81523360048201526024016103fa565b6001600160a01b0382166105ac5760405163ec442f0560e01b8152600060048201526024016103fa565b610371600083836106df565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b0384166106345760405163e602df0560e01b8152600060048201526024016103fa565b6001600160a01b03831661065e57604051634a1406b160e11b8152600060048201526024016103fa565b6001600160a01b03808516600090815260016020908152604080832093871683529290522082905580156104f057826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516106d191815260200190565b60405180910390a350505050565b6001600160a01b03831661070a5780600260008282546106ff9190610991565b9091555061077c9050565b6001600160a01b0383166000908152602081905260409020548181101561075d5760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016103fa565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216610798576002805482900390556107b7565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516107fc91815260200190565b60405180910390a3505050565b600060208083528351808285015260005b818110156108365785810183015185820160400152820161081a565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b038116811461086e57600080fd5b919050565b6000806040838503121561088657600080fd5b61088f83610857565b946020939093013593505050565b6000806000606084860312156108b257600080fd5b6108bb84610857565b92506108c960208501610857565b9150604084013590509250925092565b6000602082840312156108eb57600080fd5b6108f482610857565b9392505050565b6000806040838503121561090e57600080fd5b61091783610857565b915061092560208401610857565b90509250929050565b600181811c9082168061094257607f821691505b60208210810361096257634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8181038181111561033557610335610968565b808201808211156103355761033561096856fea264697066735822' +
  '1220c66820ef7c3c595640c19cf33696b1c9f8fb97fd136562ca35785e268b9ee19664736f6c63430008140033' as const;
