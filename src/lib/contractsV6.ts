/**
 * V6 Bonding Curve Contract Configuration
 * 
 * This file contains contract addresses and ABIs for the V6 bonding curve system.
 * 
 * Addresses are fetched dynamically from the database after deployment via the
 * deploy-v6-contracts edge function. Fallback to placeholders for development.
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// CONTRACT ADDRESSES (Base Sepolia - defaults/fallbacks)
// =============================================================================

// Core infrastructure (already deployed)
export const PROMPT_TOKEN_ADDRESS = '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673';
export const VAULT_ADDRESS = '0xBaFe4E2C27f1c0bb8e562262Dd54E3F1BB959140'; // Checksummed!
export const UNISWAP_FACTORY_ADDRESS = '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6';
export const UNISWAP_ROUTER_ADDRESS = '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24';

// V6 contracts - PLACEHOLDER - These are fetched from DB after deployment
export const REWARD_DISTRIBUTOR_V6_ADDRESS = '0x0000000000000000000000000000000000000000';
export const TEAM_VESTING_V6_ADDRESS = '0x0000000000000000000000000000000000000000';
export const LP_LOCKER_V6_ADDRESS = '0x0000000000000000000000000000000000000000';
export const GRADUATION_MANAGER_V6_ADDRESS = '0x0000000000000000000000000000000000000000';
export const AGENT_FACTORY_V6_ADDRESS = '0x0000000000000000000000000000000000000000';

// =============================================================================
// DATABASE FETCH FUNCTIONS
// =============================================================================

export interface V6Addresses {
  rewardDistributor: string;
  teamVesting: string;
  lpLocker: string;
  graduationManager: string;
  agentFactory: string;
  promptToken: string;
  vault: string;
  uniswapFactory: string;
  uniswapRouter: string;
}

/**
 * Fetch V6 contract addresses from the deployed_contracts table
 */
export async function fetchV6AddressesFromDB(chainId: number = 84532): Promise<V6Addresses | null> {
  const network = chainId === 84532 ? 'base_sepolia' : 'base_mainnet';
  
  const { data, error } = await supabase
    .from('deployed_contracts')
    .select('contract_type, contract_address')
    .eq('version', 'v6')
    .eq('network', network)
    .eq('is_active', true);
  
  if (error || !data || data.length === 0) {
    console.log('[contractsV6] No V6 contracts found in database for', network);
    return null;
  }

  const contractMap = new Map(data.map(c => [c.contract_type, c.contract_address]));
  
  // Get network-specific infrastructure addresses
  const infra = chainId === 84532 ? {
    promptToken: PROMPT_TOKEN_ADDRESS,
    vault: VAULT_ADDRESS,
    uniswapFactory: UNISWAP_FACTORY_ADDRESS,
    uniswapRouter: UNISWAP_ROUTER_ADDRESS,
  } : {
    promptToken: '0x0000000000000000000000000000000000000000', // Update for mainnet
    vault: '0x0000000000000000000000000000000000000000',
    uniswapFactory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    uniswapRouter: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
  };

  return {
    rewardDistributor: contractMap.get('RewardDistributor_V6') || REWARD_DISTRIBUTOR_V6_ADDRESS,
    teamVesting: contractMap.get('TeamVesting_V6') || TEAM_VESTING_V6_ADDRESS,
    lpLocker: contractMap.get('LPLocker_V6') || LP_LOCKER_V6_ADDRESS,
    graduationManager: contractMap.get('GraduationManager_V6') || GRADUATION_MANAGER_V6_ADDRESS,
    agentFactory: contractMap.get('AgentFactory_V6') || AGENT_FACTORY_V6_ADDRESS,
    ...infra,
  };
}

/**
 * Get V6 addresses for a specific chain, with database lookup
 */
export async function getV6AddressesForChain(chainId: number): Promise<V6Addresses> {
  // Try database first
  const dbAddresses = await fetchV6AddressesFromDB(chainId);
  if (dbAddresses) {
    return dbAddresses;
  }
  
  // Fallback to static addresses
  return getV6Addresses() as V6Addresses;
}

// =============================================================================
// CONTRACT ABIS
// =============================================================================

export const REWARD_DISTRIBUTOR_V6_ABI = [
  'function setRewards(address agentToken, address[] calldata holders, uint256[] calldata amounts) external',
  'function calculateVestedAmount(address holder, address agentToken) external view returns (uint256)',
  'function claimRewards(address agentToken) external',
  'function getRewardInfo(address holder, address agentToken) external view returns (uint256 totalAmount, uint256 claimed, uint256 claimable, uint256 startTime, uint256 timeRemaining)',
  'function graduationTimes(address agentToken) external view returns (uint256)',
  'event RewardsSet(address indexed agentToken, address indexed holder, uint256 amount, uint256 startTime)',
  'event RewardsClaimed(address indexed agentToken, address indexed holder, uint256 amount)',
] as const;

export const TEAM_VESTING_V6_ABI = [
  'function setVesting(address agentToken, address beneficiary, uint256 amount) external',
  'function calculateClaimable(address agentToken) external view returns (uint256)',
  'function claim(address agentToken) external',
  'function getVestingInfo(address agentToken) external view returns (uint256 totalAmount, uint256 claimed, uint256 claimable, uint256 cliff1Time, uint256 cliff2Time, address beneficiary)',
  'function CLIFF_1() external view returns (uint256)',
  'function CLIFF_2() external view returns (uint256)',
  'event VestingSet(address indexed agentToken, address indexed beneficiary, uint256 amount, uint256 startTime)',
  'event TokensClaimed(address indexed agentToken, address indexed beneficiary, uint256 amount)',
] as const;

export const LP_LOCKER_V6_ABI = [
  'function lock(address lpToken, uint256 amount, uint256 unlockTime, address beneficiary) external returns (uint256 lockId)',
  'function withdraw(uint256 lockId) external',
  'function getLockInfo(uint256 lockId) external view returns (address lpToken, uint256 amount, uint256 unlockTime, address beneficiary, bool withdrawn, uint256 timeRemaining)',
  'function nextLockId() external view returns (uint256)',
  'event Locked(uint256 indexed lockId, address indexed lpToken, uint256 amount, uint256 unlockTime, address indexed beneficiary)',
  'event Withdrawn(uint256 indexed lockId, address indexed beneficiary, uint256 amount)',
] as const;

export const GRADUATION_MANAGER_V6_ABI = [
  'function executeGraduation(address agentToken, address[] calldata holders, uint256[] calldata holderAmounts, address[] calldata rewardRecipients, uint256[] calldata rewardAmounts, address creator) external returns (uint256 lockId)',
  'function getGraduationInfo(address agentToken) external view returns (address lpPair, uint256 totalLpTokens, uint256 lpLocked, uint256 lpToVault, uint256 lockId, uint256 timestamp)',
  'function isGraduated(address agentToken) external view returns (bool)',
  'function LOCK_DURATION() external view returns (uint256)',
  'function LP_LOCK_BPS() external view returns (uint256)',
  'function TEAM_ALLOCATION() external view returns (uint256)',
  'function GRADUATION_THRESHOLD() external view returns (uint256)',
  'event GraduationExecuted(address indexed agentToken, address lpPair, uint256 holdersTotal, uint256 rewardsTotal, uint256 lpTokens, uint256 lpLocked, uint256 lockId)',
] as const;

export const AGENT_FACTORY_V6_ABI = [
  'function createAgent(string memory name, string memory symbol) external returns (address agentToken)',
  'function CREATION_FEE() external view returns (uint256)',
  'function promptToken() external view returns (address)',
  'function vault() external view returns (address)',
  'function graduationManager() external view returns (address)',
  'event AgentCreated(address indexed agentToken, address indexed creator, string name, string symbol, uint256 timestamp)',
] as const;

export const AGENT_TOKEN_V6_ABI = [
  'function mintAtGraduation(address[] calldata holders, uint256[] calldata holderAmounts, address rewardDistributor, uint256 totalRewards, address teamVesting, address vault, address lpRecipient) external',
  'function isGraduated() external view returns (bool)',
  'function graduationManager() external view returns (address)',
  'function hasGraduated() external view returns (bool)',
  'function TOTAL_SUPPLY() external view returns (uint256)',
  'function VAULT_ALLOCATION() external view returns (uint256)',
  'function TEAM_ALLOCATION() external view returns (uint256)',
  'function VARIABLE_POOL() external view returns (uint256)',
  'function MIN_LP_TOKENS() external view returns (uint256)',
  'event Graduated(uint256 timestamp, uint256 holdersTotal, uint256 rewardsTotal, uint256 lpTotal)',
] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if V6 contracts are deployed (not placeholder addresses)
 */
export function isV6Deployed(): boolean {
  return GRADUATION_MANAGER_V6_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get all V6 contract addresses
 */
export function getV6Addresses() {
  return {
    rewardDistributor: REWARD_DISTRIBUTOR_V6_ADDRESS,
    teamVesting: TEAM_VESTING_V6_ADDRESS,
    lpLocker: LP_LOCKER_V6_ADDRESS,
    graduationManager: GRADUATION_MANAGER_V6_ADDRESS,
    agentFactory: AGENT_FACTORY_V6_ADDRESS,
    promptToken: PROMPT_TOKEN_ADDRESS,
    vault: VAULT_ADDRESS,
    uniswapFactory: UNISWAP_FACTORY_ADDRESS,
    uniswapRouter: UNISWAP_ROUTER_ADDRESS,
  };
}

/**
 * V6 Constants (matching smart contract values)
 */
export const V6_CONSTANTS = {
  TOTAL_SUPPLY: 1_000_000_000n * 10n ** 18n, // 1B tokens
  VAULT_ALLOCATION: 20_000_000n * 10n ** 18n, // 2% (20M)
  TEAM_ALLOCATION: 100_000_000n * 10n ** 18n, // 10% (100M)
  VARIABLE_POOL: 880_000_000n * 10n ** 18n, // 88% (880M)
  MIN_LP_TOKENS: 565_000_000n * 10n ** 18n, // 56.5% (565M)
  CREATION_FEE: 100n * 10n ** 18n, // 100 PROMPT
  GRADUATION_THRESHOLD: 42_000n * 10n ** 18n, // 42K PROMPT
  LP_LOCK_DURATION: 3n * 365n * 24n * 60n * 60n, // 3 years
  LP_LOCK_BPS: 9500n, // 95%
  HOLDER_REWARD_VEST_DAYS: 30n,
  TEAM_CLIFF_1_DAYS: 90n,
  TEAM_CLIFF_2_DAYS: 180n,
} as const;
