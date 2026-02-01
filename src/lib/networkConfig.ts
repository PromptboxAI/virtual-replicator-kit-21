/**
 * Network Configuration - Environment-Based Chain Selection
 * 
 * Phase 2: Mainnet Migration
 * Single source of truth for network configuration.
 * Switch between testnet and mainnet via VITE_NETWORK_MODE environment variable.
 */

import { base, baseSepolia } from 'viem/chains';

// Network mode from environment (defaults to testnet for safety)
export const NETWORK_MODE = (import.meta.env.VITE_NETWORK_MODE as 'testnet' | 'mainnet') || 'testnet';

// Chain configurations
export const CHAIN_CONFIGS = {
  mainnet: {
    chain: base,
    chainId: 8453,
    name: 'Base',
    displayName: 'Base Mainnet',
    rpcUrl: import.meta.env.VITE_BASE_MAINNET_RPC || 'https://mainnet.base.org',
    rpcBackup: 'https://base.llamarpc.com',
    explorerUrl: 'https://basescan.org',
    explorerName: 'Basescan',
    isTestnet: false,
    networkString: 'base_mainnet', // For database queries
  },
  testnet: {
    chain: baseSepolia,
    chainId: 84532,
    name: 'Base Sepolia',
    displayName: 'Base Sepolia',
    rpcUrl: import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    rpcBackup: 'https://base-sepolia.blockpi.network/v1/rpc/public',
    explorerUrl: 'https://sepolia.basescan.org',
    explorerName: 'Basescan (Sepolia)',
    isTestnet: true,
    networkString: 'base_sepolia', // For database queries
  },
} as const;

// Active chain based on environment
export const ACTIVE_CHAIN = CHAIN_CONFIGS[NETWORK_MODE];

// Export commonly used values
export const CHAIN_ID = ACTIVE_CHAIN.chainId;
export const CHAIN = ACTIVE_CHAIN.chain;
export const RPC_URL = ACTIVE_CHAIN.rpcUrl;
export const EXPLORER_URL = ACTIVE_CHAIN.explorerUrl;
export const NETWORK_STRING = ACTIVE_CHAIN.networkString;
export const IS_TESTNET = ACTIVE_CHAIN.isTestnet;

// Fallback RPC endpoints for resilience
export const RPC_ENDPOINTS = [
  ACTIVE_CHAIN.rpcUrl,
  ACTIVE_CHAIN.rpcBackup,
  ...(NETWORK_MODE === 'testnet' 
    ? ['https://base-sepolia-rpc.publicnode.com']
    : ['https://base.meowrpc.com', 'https://base.publicnode.com']
  ),
];

/**
 * Get explorer URL for a transaction, address, or token
 */
export function getExplorerUrl(type: 'tx' | 'address' | 'token', hash: string): string {
  return `${ACTIVE_CHAIN.explorerUrl}/${type}/${hash}`;
}

/**
 * Get explorer URL for a transaction
 */
export function getTxExplorerUrl(txHash: string): string {
  return getExplorerUrl('tx', txHash);
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(address: string): string {
  return getExplorerUrl('address', address);
}

/**
 * Get explorer URL for a token contract
 */
export function getTokenExplorerUrl(tokenAddress: string): string {
  return getExplorerUrl('token', tokenAddress);
}

/**
 * Get network string for database queries
 */
export function getNetworkString(): string {
  return ACTIVE_CHAIN.networkString;
}

/**
 * Check if current network is mainnet
 */
export function isMainnet(): boolean {
  return NETWORK_MODE === 'mainnet';
}

/**
 * Check if current network is testnet
 */
export function isTestnet(): boolean {
  return NETWORK_MODE === 'testnet';
}
