/**
 * Contract Addresses - Environment-Based Configuration
 * 
 * Phase 2: Mainnet Migration
 * Single source of truth for all contract addresses.
 * Addresses are selected based on VITE_NETWORK_MODE environment variable.
 */

import { NETWORK_MODE } from './networkConfig';

// V8 Contract Addresses by Network
const V8_CONTRACTS_BY_NETWORK = {
  mainnet: {
    BONDING_CURVE: import.meta.env.VITE_MAINNET_BONDING_CURVE || '0x0000000000000000000000000000000000000000',
    AGENT_FACTORY: import.meta.env.VITE_MAINNET_AGENT_FACTORY || '0x0000000000000000000000000000000000000000',
    GRADUATION_MANAGER: import.meta.env.VITE_MAINNET_GRADUATION_MANAGER || '0x0000000000000000000000000000000000000000',
    TRADING_ROUTER: import.meta.env.VITE_MAINNET_TRADING_ROUTER || '0x0000000000000000000000000000000000000000',
  },
  testnet: {
    BONDING_CURVE: '0xc511a151b0E04D5Ba87968900eE90d310530D5fB',
    AGENT_FACTORY: '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79',
    GRADUATION_MANAGER: '0x3c6878857FB1d1a1155b016A4b904c479395B2D9',
    TRADING_ROUTER: '0xce81D37B4f2855Ce1081D172dF7013b8beAE79B0',
  },
} as const;

// V7 Reused Contracts (same on both networks for now)
const V7_CONTRACTS_BY_NETWORK = {
  mainnet: {
    LP_LOCKER: import.meta.env.VITE_MAINNET_LP_LOCKER || '0x0000000000000000000000000000000000000000',
    TEAM_MILESTONE_VESTING: import.meta.env.VITE_MAINNET_TEAM_MILESTONE_VESTING || '0x0000000000000000000000000000000000000000',
    TEAM_TIME_VESTING: import.meta.env.VITE_MAINNET_TEAM_TIME_VESTING || '0x0000000000000000000000000000000000000000',
    ECOSYSTEM_REWARDS: import.meta.env.VITE_MAINNET_ECOSYSTEM_REWARDS || '0x0000000000000000000000000000000000000000',
  },
  testnet: {
    LP_LOCKER: '0xB8028c5Bf3Eb648279740A1B41387d7a854D48B2',
    TEAM_MILESTONE_VESTING: '0xB204ce88f4a18a62b3D02C2598605a6c55186E05',
    TEAM_TIME_VESTING: '0xf0C530f3308714Aa28B8199EB7f41B6CD8386f29',
    ECOSYSTEM_REWARDS: '0xce11297AD83e1A6cF3635226a2348B8Ed7a6C925',
  },
} as const;

// PROMPT Token Address by Network
const PROMPT_TOKEN_BY_NETWORK = {
  mainnet: import.meta.env.VITE_MAINNET_PROMPT_TOKEN || '0x0000000000000000000000000000000000000000',
  testnet: '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673',
} as const;

// V6 Contract Addresses by Network
const V6_CONTRACTS_BY_NETWORK = {
  mainnet: {
    VAULT: import.meta.env.VITE_MAINNET_VAULT || '0x0000000000000000000000000000000000000000',
    UNISWAP_V2_FACTORY: import.meta.env.VITE_MAINNET_UNISWAP_FACTORY || '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    UNISWAP_V2_ROUTER: import.meta.env.VITE_MAINNET_UNISWAP_ROUTER || '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  testnet: {
    VAULT: '0xce39AF1C8E2a2ecCB5A1C8Ed068Af1f55F59fD7F',
    UNISWAP_V2_FACTORY: '0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e',
    UNISWAP_V2_ROUTER: '0x1689E7B1F10000AE47eBfE339a4f69dECd19F602',
    WETH: '0x4200000000000000000000000000000000000006',
  },
} as const;

// Export active contract addresses based on network mode
export const V8_CONTRACTS = V8_CONTRACTS_BY_NETWORK[NETWORK_MODE];
export const V7_CONTRACTS = V7_CONTRACTS_BY_NETWORK[NETWORK_MODE];
export const V6_CONTRACTS = V6_CONTRACTS_BY_NETWORK[NETWORK_MODE];
export const PROMPT_TOKEN_ADDRESS = PROMPT_TOKEN_BY_NETWORK[NETWORK_MODE];

// V8 Constants (same across networks)
export const V8_CONSTANTS = {
  // Graduation threshold in PROMPT
  GRADUATION_THRESHOLD: 42160,
  GRADUATION_THRESHOLD_STR: '42160',
  GRADUATION_THRESHOLD_WEI: BigInt('42160000000000000000000'),
  
  // Bonding curve parameters
  P0: BigInt('40000000000000'),           // 0.00004 in wei
  P1: BigInt('300000000000000'),          // 0.0003 in wei
  P0_STRING: '0.00004',
  P1_STRING: '0.0003',
  
  // Trading fee
  TRADING_FEE_BPS: 50, // 0.5%
  
  // Airdrop batch size
  AIRDROP_BATCH_SIZE: 100,
  
  // Token allocations
  HOLDER_ALLOCATION: 80,
  TEAM_ALLOCATION: 10,
  REWARDS_ALLOCATION: 10,
  
  // Total supply
  TOTAL_SUPPLY: 1000000000,
} as const;

// Helper: Get all V8 contracts as an object
export function getV8Contracts() {
  return V8_CONTRACTS;
}

// Helper: Get PROMPT token address
export function getPromptTokenAddress(): string {
  return PROMPT_TOKEN_ADDRESS;
}

// Helper: Check if address is a known contract
export function isKnownContract(address: string): boolean {
  const lowercaseAddress = address.toLowerCase();
  const allAddresses = [
    ...Object.values(V8_CONTRACTS),
    ...Object.values(V7_CONTRACTS),
    ...Object.values(V6_CONTRACTS),
    PROMPT_TOKEN_ADDRESS,
  ].map(a => a.toLowerCase());
  
  return allAddresses.includes(lowercaseAddress);
}
