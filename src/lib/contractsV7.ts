/**
 * V7 Contract Integration
 * 
 * This file contains constants, addresses, and ABIs for V7 smart contracts.
 * Addresses will be populated after deployment to Base Sepolia.
 */

// ============ V7 Constants (matching Solidity) ============
export const V7_CONTRACT_CONSTANTS = {
  // Total Supply: 1B tokens
  TOTAL_SUPPLY: 1_000_000_000,
  
  // Fixed Allocations (640M = 64%)
  LP_ALLOCATION: 140_000_000,           // 14% - Fixed for price continuity
  TEAM_MILESTONE_ALLOCATION: 250_000_000, // 25% - 5 FDV milestones
  TEAM_TIME_ALLOCATION: 200_000_000,    // 20% - 1yr cliff + 6mo vest
  ECOSYSTEM_ALLOCATION: 50_000_000,     // 5% - PROMPT holder rewards
  
  // Variable Pool (360M = 36%)
  VARIABLE_POOL: 360_000_000,           // Holders + Rewards + Vault
  TRADEABLE_CAP: 248_000_000,           // Max shares on bonding curve
  
  // Graduation
  GRADUATION_THRESHOLD: 42_160,         // PROMPT required to graduate
  
  // LP Locking
  LOCK_DURATION_YEARS: 3,               // 3 years LP lock
  LP_LOCK_BPS: 9500,                    // 95% locked
  
  // Fees
  TRADING_FEE_BPS: 500,                 // 5% total fee
  CREATOR_FEE_BPS: 5000,                // 50% of fee to creator
  PLATFORM_FEE_BPS: 5000,               // 50% of fee to platform
  
  // Pricing
  DEFAULT_P0: 0.00004,                  // Starting price
  DEFAULT_P1: 0.0003,                   // Ending price at graduation
  
  // Team Milestone FDV Targets (USD)
  FDV_MILESTONES: [
    500_000,    // $500K -> 50M tokens
    1_000_000,  // $1M -> 50M tokens
    5_000_000,  // $5M -> 50M tokens
    10_000_000, // $10M -> 50M tokens
    50_000_000, // $50M -> 50M tokens
  ],
  TOKENS_PER_MILESTONE: 50_000_000,     // 50M per milestone
  
  // Team Time Vesting
  CLIFF_DURATION_DAYS: 365,             // 1 year cliff
  VEST_DURATION_DAYS: 180,              // 6 months linear vest
} as const;

// ============ External Dependencies (Base Sepolia) ============
export const V7_EXTERNAL = {
  PROMPT_TOKEN: '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673',
  VAULT: '0xBaFe4E2C27f1c0bb8e562262Dd54E3F1BB959140',
  UNISWAP_FACTORY: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
  UNISWAP_ROUTER: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
} as const;

// ============ V7 Contract Addresses (Populate after deployment) ============
export const V7_CONTRACTS = {
  REWARD_DISTRIBUTOR: '',
  TEAM_MILESTONE_VESTING: '',
  TEAM_TIME_VESTING: '',
  ECOSYSTEM_REWARDS: '',
  LP_LOCKER: '',
  GRADUATION_MANAGER_V7: '',
} as const;

// ============ ABIs ============
// Minimal ABIs for frontend interaction

export const GRADUATION_MANAGER_V7_ABI = [
  {
    name: 'executeGraduation',
    type: 'function',
    inputs: [
      { name: 'agentToken', type: 'address' },
      { name: 'holders', type: 'address[]' },
      { name: 'holderAmounts', type: 'uint256[]' },
      { name: 'rewardRecipients', type: 'address[]' },
      { name: 'rewardAmounts', type: 'uint256[]' },
      { name: 'ecosystemHolders', type: 'address[]' },
      { name: 'ecosystemAmounts', type: 'uint256[]' },
      { name: 'totalPromptSnapshot', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'priceOracle', type: 'address' },
    ],
    outputs: [{ name: 'lockId', type: 'uint256' }],
  },
  {
    name: 'getGraduationInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [
      {
        name: 'info',
        type: 'tuple',
        components: [
          { name: 'lpPair', type: 'address' },
          { name: 'totalLpTokens', type: 'uint256' },
          { name: 'lpLocked', type: 'uint256' },
          { name: 'lpToVault', type: 'uint256' },
          { name: 'lockId', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'promptRaised', type: 'uint256' },
          { name: 'holdersCount', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'isGraduated',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getV7Constants',
    type: 'function',
    stateMutability: 'pure',
    inputs: [],
    outputs: [
      { name: 'lpAllocation', type: 'uint256' },
      { name: 'graduationThreshold', type: 'uint256' },
      { name: 'lockDuration', type: 'uint256' },
      { name: 'lpLockBps', type: 'uint256' },
    ],
  },
] as const;

export const AGENT_TOKEN_V7_ABI = [
  {
    name: 'isGraduated',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'hasGraduated',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'TOTAL_SUPPLY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'LP_ALLOCATION',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const TEAM_MILESTONE_VESTING_ABI = [
  {
    name: 'getVestingInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimed', type: 'uint256' },
      { name: 'claimable', type: 'uint256' },
      { name: 'milestonesAchieved', type: 'uint256' },
      { name: 'currentFDV', type: 'uint256' },
      { name: 'nextMilestoneFDV', type: 'uint256' },
      { name: 'beneficiary', type: 'address' },
      { name: 'priceOracle', type: 'address' },
    ],
  },
  {
    name: 'claim',
    type: 'function',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [],
  },
  {
    name: 'calculateClaimable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const TEAM_TIME_VESTING_ABI = [
  {
    name: 'getVestingInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimed', type: 'uint256' },
      { name: 'claimable', type: 'uint256' },
      { name: 'vested', type: 'uint256' },
      { name: 'cliffEndTime', type: 'uint256' },
      { name: 'vestEndTime', type: 'uint256' },
      { name: 'cliffPassed', type: 'bool' },
      { name: 'fullyVested', type: 'bool' },
      { name: 'beneficiary', type: 'address' },
    ],
  },
  {
    name: 'claim',
    type: 'function',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [],
  },
  {
    name: 'getTimeRemaining',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [
      { name: 'secondsUntilCliff', type: 'uint256' },
      { name: 'secondsUntilFullVest', type: 'uint256' },
    ],
  },
] as const;

export const ECOSYSTEM_REWARDS_ABI = [
  {
    name: 'getClaimableAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentToken', type: 'address' },
      { name: 'holder', type: 'address' },
    ],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
  {
    name: 'claim',
    type: 'function',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [],
  },
  {
    name: 'batchClaim',
    type: 'function',
    inputs: [{ name: 'agentTokens', type: 'address[]' }],
    outputs: [],
  },
  {
    name: 'getScheduleInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'totalClaimed', type: 'uint256' },
      { name: 'remaining', type: 'uint256' },
      { name: 'snapshotTime', type: 'uint256' },
      { name: 'totalPromptSnapshot', type: 'uint256' },
    ],
  },
] as const;

export const REWARD_DISTRIBUTOR_ABI = [
  {
    name: 'getClaimableAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentToken', type: 'address' },
      { name: 'holder', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claim',
    type: 'function',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [],
  },
] as const;

// ============ V7 ABIs Collection ============
export const V7_ABIS = {
  GRADUATION_MANAGER_V7: GRADUATION_MANAGER_V7_ABI,
  AGENT_TOKEN_V7: AGENT_TOKEN_V7_ABI,
  TEAM_MILESTONE_VESTING: TEAM_MILESTONE_VESTING_ABI,
  TEAM_TIME_VESTING: TEAM_TIME_VESTING_ABI,
  ECOSYSTEM_REWARDS: ECOSYSTEM_REWARDS_ABI,
  REWARD_DISTRIBUTOR: REWARD_DISTRIBUTOR_ABI,
} as const;
