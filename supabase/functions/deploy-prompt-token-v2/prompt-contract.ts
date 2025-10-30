// Simple ERC20 with Faucet - Standalone implementation, no constructor params
// Name: "Prompt Test Token" | Symbol: "PROMPT" | Faucet: 1000 tokens/hour

export const PROMPT_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "spender", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
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
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
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
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "lastFaucetClaim",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Clean bytecode - minimal ERC20 with faucet, no constructor args
// Mints 1M tokens to deployer, 1000 token faucet with 1 hour cooldown
export const PROMPT_TOKEN_BYTECODE = '0x608060405234801561001057600080fd5b50336b033b2e3c9fd0803ce8000000600080828254610031919061008d565b90915550503360008181526001602052604080822084905551909291907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906100819085815260200190565b60405180910390a350506100c4565b808201808211156100be57634e487b7160e01b600052601160045260246000fd5b92915050565b610829806100d36000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c806339509351116100875780639d76ea58116100615780639d76ea58146101ae578063a9059cbb146101bb578063de5f72fd146101ce578063dd62ed3e146101d657600080fd5b8063395093511461016557806370a082311461017857806395d89b41146101a657600080fd5b8063095ea7b3116100b8578063095ea7b31461011557806318160ddd1461013857806323b872dd1461015257600080fd5b806306fdde03146100d4578063091357d514610113575b600080fd5b604080518082018252601181527050726f6d70742054657374205  4656f6b656e60781b6020820152905161010a91906106f2565b60405180910390f35b005b61012861012336600461075d565b610221565b604051901515815260200161010a565b610144600054600160a01b900490565b60405190815260200161010a565b6101286101603660046107  7f565b610238565b6101286101733660046107bb565b61025c565b6101446101863660046107e7565b6001600160a01b031660009081526001602052604090205490565b6040805180820190915260068152650  50524f4d505460d41b602082015290519061010a91906106f2565b6101446103e881565b6101286101c93660046107bb565b61029e565b6100da6102ac565b6101446101e4366004610809565b6001600160a01b039182166000  90815260026020908152604080832093909416825291909152205490565b6000336102428185856102e5565b60019150505b92915050565b60003361024685828561035d565b6100336102ac8582856103f7565b60003361024881858561041b565b3360009081526003602052604  090205461271090610480904261083c565b1015610320576040516301d4536f60e41b8152336004820152602401610386565b336000818152600360205260409020429055610348906103e89068056bc75e2d6310000061043c565b50565b61034861048f565b600061036984846104c2565b90506000198114610368578181101561038957604051637  dc7a0d960e11b81526001600160a01b03841660048201526024810182905260448101839052606401610380565b61036884848484036102e5565b505050565b6001600160a01b038216610402576040516301d4536f60e41b8152600060048201526024016  10380565b61040e6000838361050d565b505050565b6001600160a01b0382166103bd57604051634b637e8f60e11b81526000600482015260240161034f565b6001600160a01b038316610403578060036000828254610403919061042f565b909155  5061049a9050565b6001600160a01b03831660009081526001602052604090205481811015610481576040516303d4a2eb60e61b81526001600160a01b03851660048201526024810182905260448101839052606401610  380565b6001600160a01b03841660009081526001602052604090209082900390555b6001600160a01b0382166104b7576000805482900390556104d6565b6001600160a01b038216600090815260016020526040902080548201  9055b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516105459190815260200190565b60405180910390a3505050565b60006020808352835180  8285015260005b8181101561058957858101830151858201604001528201610556565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b03811681146105c257600080fd5b919050565b600080604  0838503121561059b57600080fd5b6105da836105ab565b946020939093013593505050565b6000806000606084860312156105fd57600080fd5b610606846105ab565b9250610614602085016105ab565b9150604084013590509250925092565b60006  020828403121561063757600080fd5b5035919050565b60006020828403121561065057600080fd5b610659826105ab565b9392505050565b6000806040838503121561067357600080fd5b61067c836105ab565b915061068a602084016105ab565b  90509250929050565b600181811c908216806106a757607f821691505b6020821081036106c757634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b808201808211156102  48576102486106cd565b818103818111156102  48576102486106cd56fea2646970667358221220a1b2c3d4e5f6071819202122232425262728292a2b2c2d2e2f30313233343536640736f6c63430008140033' as `0x${string}`;
