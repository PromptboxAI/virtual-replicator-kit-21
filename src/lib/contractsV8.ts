/**
 * V8 On-Chain Trading Contract Definitions
 * 
 * V8 represents a major shift from database-mode trading (V6/V7) to fully on-chain trading.
 * Key changes:
 * - Trading is ON-CHAIN: users sign transactions to BondingCurveV8
 * - Two-token system: PrototypeToken during curve → AgentTokenV8 at graduation
 * - Batched airdrop with trading gate: platform auto-airdrops, no user claims
 * - Graduation threshold: 42,160 PROMPT
 */

// V8 Contract Addresses (Base Sepolia)
export const V8_CONTRACTS = {
  BONDING_CURVE: '0xc511a151b0E04D5Ba87968900eE90d310530D5fB',
  AGENT_FACTORY: '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79',
  GRADUATION_MANAGER: '0x3c6878857FB1d1a1155b016A4b904c479395B2D9',
  TRADING_ROUTER: '0xce81D37B4f2855Ce1081D172dF7013b8beAE79B0',
} as const;

// Reuse V7 contracts (DO NOT recreate)
export const V7_REUSED_CONTRACTS = {
  LP_LOCKER: '0xB8028c5Bf3Eb648279740A1B41387d7a854D48B2',
  TEAM_MILESTONE_VESTING: '0xB204ce88f4a18a62b3D02C2598605a6c55186E05',
  TEAM_TIME_VESTING: '0xf0C530f3308714Aa28B8199EB7f41B6CD8386f29',
  ECOSYSTEM_REWARDS: '0xce11297AD83e1A6cF3635226a2348B8Ed7a6C925',
} as const;

// V8 Constants
export const V8_CONSTANTS = {
  // Graduation threshold in PROMPT
  GRADUATION_THRESHOLD: '42160',
  GRADUATION_THRESHOLD_WEI: BigInt('42160000000000000000000'),
  
  // Bonding curve parameters
  P0: BigInt('10000000000000'), // 0.00001 PROMPT (starting price)
  P1: BigInt('100000000'), // 0.0000000001 (price coefficient)
  
  // Trading fee
  TRADING_FEE_BPS: 50, // 0.5%
  
  // Airdrop batch size
  AIRDROP_BATCH_SIZE: 100,
  
  // Token allocations (percentages)
  HOLDER_ALLOCATION: 80, // 80% to curve participants
  TEAM_ALLOCATION: 10,   // 10% to team (vested)
  REWARDS_ALLOCATION: 10, // 10% to ecosystem rewards
} as const;

// BondingCurveV8 ABI (minimal for frontend)
export const BONDING_CURVE_V8_ABI = [
  // Read functions
  {
    name: 'quoteBuy',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'promptAmountIn', type: 'uint256' }
    ],
    outputs: [
      { name: 'tokenAmountOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
      { name: 'priceAfter', type: 'uint256' }
    ]
  },
  {
    name: 'quoteSell',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'tokenAmountIn', type: 'uint256' }
    ],
    outputs: [
      { name: 'promptAmountOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
      { name: 'priceAfter', type: 'uint256' }
    ]
  },
  {
    name: 'getAgentState',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [
      { name: 'prototypeToken', type: 'address' },
      { name: 'supply', type: 'uint256' },
      { name: 'reserve', type: 'uint256' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'graduated', type: 'bool' }
    ]
  },
  // Write functions
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'promptAmount', type: 'uint256' },
      { name: 'minTokensOut', type: 'uint256' }
    ],
    outputs: [{ name: 'tokensBought', type: 'uint256' }]
  },
  {
    name: 'sell',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'tokenAmount', type: 'uint256' },
      { name: 'minPromptOut', type: 'uint256' }
    ],
    outputs: [{ name: 'promptReceived', type: 'uint256' }]
  },
  // Events
  {
    name: 'Trade',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'bytes32', indexed: true },
      { name: 'trader', type: 'address', indexed: true },
      { name: 'isBuy', type: 'bool', indexed: false },
      { name: 'promptAmountGross', type: 'uint256', indexed: false },
      { name: 'promptAmountNet', type: 'uint256', indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'supplyAfter', type: 'uint256', indexed: false },
      { name: 'reserveAfter', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  }
] as const;

// AgentFactoryV8 ABI (minimal for frontend)
export const AGENT_FACTORY_V8_ABI = [
  {
    name: 'createAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'creator', type: 'address' }
    ],
    outputs: [{ name: 'prototypeToken', type: 'address' }]
  },
  {
    name: 'AgentCreated',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'bytes32', indexed: true },
      { name: 'prototypeToken', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false }
    ]
  }
] as const;

// GraduationManagerV8 ABI (for reference - called by backend)
export const GRADUATION_MANAGER_V8_ABI = [
  {
    name: 'initializeGraduation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'totalHolderTokens', type: 'uint256' },
      { name: 'totalRewardTokens', type: 'uint256' },
      { name: 'snapshotBlockNumber', type: 'uint256' },
      { name: 'snapshotHash', type: 'bytes32' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'airdropBatch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  },
  {
    name: 'GraduationInitialized',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'bytes32', indexed: true },
      { name: 'finalToken', type: 'address', indexed: true },
      { name: 'snapshotBlockNumber', type: 'uint256', indexed: false },
      { name: 'snapshotHash', type: 'bytes32', indexed: false }
    ]
  },
  {
    name: 'AirdropBatchCompleted',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'bytes32', indexed: true },
      { name: 'batchIndex', type: 'uint256', indexed: false },
      { name: 'recipientsCount', type: 'uint256', indexed: false },
      { name: 'tokensMinted', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'TradingEnabled',
    type: 'event',
    inputs: [
      { name: 'agentId', type: 'bytes32', indexed: true },
      { name: 'lpPairAddress', type: 'address', indexed: true }
    ]
  }
] as const;

// PrototypeToken ABI (ERC20)
export const PROTOTYPE_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
] as const;

// Helper: Convert UUID to bytes32
export function uuidToBytes32(uuid: string): `0x${string}` {
  const cleanUuid = uuid.replace(/-/g, '');
  return `0x${cleanUuid.padStart(64, '0')}` as `0x${string}`;
}

// Helper: Convert bytes32 to UUID
export function bytes32ToUuid(bytes32: string): string {
  const hex = bytes32.replace('0x', '').slice(-32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Export all ABIs grouped
export const V8_ABIS = {
  BONDING_CURVE: BONDING_CURVE_V8_ABI,
  AGENT_FACTORY: AGENT_FACTORY_V8_ABI,
  GRADUATION_MANAGER: GRADUATION_MANAGER_V8_ABI,
  PROTOTYPE_TOKEN: PROTOTYPE_TOKEN_ABI,
} as const;
