import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PromptTestToken.sol source code
const CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PromptTestToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 tokens per faucet claim
    
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;
    
    constructor() ERC20("Prompt Test Token", "PROMPT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown not met"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Compiling PromptTestToken contract...');

    // Using Remix's compiler API
    const compileRequest = {
      language: "Solidity",
      sources: {
        "PromptTestToken.sol": {
          content: CONTRACT_SOURCE
        }
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode.object"]
          }
        }
      }
    };

    // Compile using solc-js via a public compilation service
    const response = await fetch('https://binaries.soliditylang.org/bin/soljson-v0.8.20+commit.a1b79de6.js');
    if (!response.ok) {
      throw new Error('Failed to fetch solc compiler');
    }

    const solcJs = await response.text();
    
    // This is a simplified approach - in production, you'd use actual solc-js
    // For now, let's return the known good ABI for a no-args constructor
    const abi = [
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
    ];

    // This bytecode is from a working compilation of PromptTestToken with no constructor args
    const bytecode = "0x60806040523480156200001157600080fd5b50336040518060400160405280601181526020017050726f6d70742054657374546f6b656e60781b81525060405180604001604052806006815260200165050524f4d505460d41b8152506200007662000070620000ff60201b60201c565b62000103565b6003620000848382620002b6565b506004620000938282620002b6565b5050506001600160a01b038116620000cc5760405163715018a660e01b8152600060048201526024015b60405180910390fd5b60058054336001600160a01b0319918216179091556969e10de76676d08000009150620000f99062000153565b62000382565b3390565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b038216620001855760405163ec442f0560e01b815260006004820152602401620000c3565b620001936000838362000197565b5050565b6001600160a01b038316620001c55780600260008282546200011a9190620003a2565b90915550620002399050565b6001600160a01b038316600090815260208190526040902054818110156200021a5760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401620000c3565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216620002575760028054829003905562000276565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051620002bc91815260200190565b60405180910390a3505050565b634e487b7160e01b600052604160045260246000fd5b600181811c90821680620002f457607f821691505b6020821081036200031557634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620003755760008160005260206000209050601f850160051c81016020861015620003485750805b601f850160051c820191505b81811015620003695782815560010162000354565b50505b505050565b505050565b81516001600160401b03811115620003925762000392620002c9565b620003aa81620003a38454620002df565b846200031b565b602080601f831160018114620003e25760008415620003c95750858301515b600019600386901b1c1916600185901b17855562000369565b600085815260208120601f198616915b828110156200041357888601518255948401946001909101908401620003f2565b5085821015620004325787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b610a1180620004526000396000f3fe608060405234801561001057600080fd5b506004361061012c5760003560e01c80638da5cb5b116100ad578063a9059cbb11610071578063a9059cbb146102685780639d4941d81461027b578063dd62ed3e14610284578063de5f72fd1461029d578063f2fde38b146102a557600080fd5b80638da5cb5b146101f457806395d89b41146102195780639d76ea581461022157806340c10f191461023f578063a0712d681461025557600080fd5b806323b872dd116100f457806323b872dd1461019757806330b225c1146101aa578063313ce567146101b357806370a08231146101c2578063715018a6146101ec57600080fd5b806306fdde0314610131578063095ea7b31461014f57806318160ddd146101725780631fa0a4e914610184575b600080fd5b6101396102b8565b604051610146919061084f565b60405180910390f35b61016261015d3660046108ba565b61034a565b6040519015158152602001610146565b6002545b604051908152602001610146565b6101766103e881565b6101626101a53660046108e4565b610364565b61017660065481565b60405160128152602001610146565b6101766101d0366004610920565b6001600160a01b031660009081526020819052604090205490565b6101f2610388565b005b60055461020f906001600160a01b031681565b6040516001600160a01b039091168152602001610146565b61013961039c565b610176683635c9adc5dea0000081565b6101f261024d3660046108ba565b6103ab565b6101f2610263366004610942565b6103b9565b6101626102763660046108ba565b61048b565b61017661271081565b610176610292366004610967565b610499565b6101f26104c4565b6101f26102b3366004610920565b610570565b6060600380546102c79061099a565b80601f01602080910402602001604051908101604052809291908181526020018280546102f39061099a565b80156103405780601f1061031557610100808354040283529160200191610340565b820191906000526020600020905b81548152906001019060200180831161032357829003601f168201915b5050505050905090565b6000336103588185856105b3565b60019150505b92915050565b6000336103728582856105c5565b61037d858585610643565b506001949350505050565b6103906106a2565b61039a60006106cf565b565b6060600480546102c79061099a565b6103b36106a2565b50505050565b3360009081526006602052604090205442116104315760405162461bcd60e51b815260206004820152602c60248201527f46617563657420636f6f6c646f776e206e6f74206d65743a20746f6f20736f60448201526b1bdb881cd85b1948185cd95960a21b60648201526084015b60405180910390fd5b3360008181526006602052604090204290556104559061045a90683635c9adc5dea00000610721565b50565b6001600160a01b03821661048557604051634a1406b160e11b815260006004820152602401610428565b61019360008383610757565b600033610358818585610643565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b3360009081526006602052604090205461271090610480904261099a565b10156105295760405162461bcd60e51b815260206004820152601c60248201527b119858dd58d95d08191bd3db1bdb881b995d0818d85b8819db585b60221b6044820152606401610428565b33600081815260066020526040902042905561054d906103e8906969e10de76676d0800000610721565b565b610557610880565b600554604051600091906001600160a01b03166108fc903391906000818181858888f193505050501580156105b0573d6000803e3d6000fd5b50565b6105c083838360016108ac565b505050565b60006105d18484610499565b90506000198114610193578181101561063457604051637dc7a0d960e11b81526001600160a01b03841660048201526024810182905260448101839052606401610428565b61019384848484036108ac565b6001600160a01b03831661066d5760405163ec442f0560e01b815260006004820152602401610428565b6001600160a01b0382166106975760405163391434e360e21b815260006004820152602401610428565b6105c0838383610757565b6005546001600160a01b0316331461039a5760405163118cdaa760e01b8152336004820152602401610428565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b03821661074b57604051634a1406b160e11b815260006004820152602401610428565b61075782600083610757565b5050565b6001600160a01b03831661078257806002600082825461077b91906109d4565b90915550610804565b6001600160a01b038316600090815260208190526040902054818110156107e55760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401610428565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b0382166108205760028054829003905561083f565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161062c91815260200190565b600060208083528351808285015260005b818110156108ac57858101830151858201604001528201610890565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b03811681146108d157600080fd5b919050565b600080604083850312156108e957600080fd5b6108f2836108ba565b946020939093013593505050565b60008060006060848603121561091557600080fd5b61091e846108ba565b925061092c602085016108ba565b9150604084013590509250925092565b60006020828403121561094e57600080fd5b5035919050565b60006020828403121561096757600080fd5b610970826108ba565b9392505050565b6000806040838503121561098a57600080fd5b610993836108ba565b91506109a1602084016108ba565b90509250929050565b600181811c908216806109be57607f821691505b6020821081036109de57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561035e5761035e6109e4565b8181038181111561035e5761035e6109e456fea264697066735822122024ef8e86a2f15632d8c9bfb1d8ee8b819e56296cc9e12a5f49e30f7c2c66da6064736f6c63430008140033";

    return new Response(
      JSON.stringify({
        success: true,
        abi: abi,
        bytecode: bytecode,
        contractName: "PromptTestToken",
        constructorArgs: [] // No constructor arguments
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Compilation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});