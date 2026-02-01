/**
 * RPC Client with Fallback Support
 * 
 * Phase 3: Error Handling
 * Provides resilient RPC connectivity with automatic failover.
 */

import { createPublicClient, http, type PublicClient, type Transport, type Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { NETWORK_MODE, RPC_ENDPOINTS } from './networkConfig';

let currentClientIndex = 0;
let publicClient: PublicClient<Transport, Chain> | null = null;

const activeChain: Chain = NETWORK_MODE === 'mainnet' ? base : baseSepolia;

/**
 * Get a working public client, cycling through fallback RPCs if needed
 */
export async function getPublicClient(): Promise<PublicClient<Transport, Chain>> {
  if (publicClient) {
    try {
      // Test if current client is responsive
      await publicClient.getBlockNumber();
      return publicClient;
    } catch {
      // Current client failed, try next
      console.warn('[rpcClient] Current RPC failed, trying fallback...');
      currentClientIndex = (currentClientIndex + 1) % RPC_ENDPOINTS.length;
      publicClient = null;
    }
  }

  // Try each endpoint until one works
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const index = (currentClientIndex + i) % RPC_ENDPOINTS.length;
    const rpcUrl = RPC_ENDPOINTS[index];
    
    try {
      const client = createPublicClient({
        chain: activeChain,
        transport: http(rpcUrl, { timeout: 10000 }),
      });
      
      await client.getBlockNumber();
      publicClient = client as PublicClient<Transport, Chain>;
      currentClientIndex = index;
      console.log(`[rpcClient] Connected to RPC: ${rpcUrl}`);
      return publicClient;
    } catch (error) {
      console.warn(`[rpcClient] RPC ${rpcUrl} failed (${i + 1}/${RPC_ENDPOINTS.length})`);
      continue;
    }
  }

  throw new Error('All RPC endpoints failed');
}

/**
 * Execute an operation with automatic RPC fallback
 */
export async function withRpcFallback<T>(
  operation: (client: PublicClient<Transport, Chain>) => Promise<T>
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const client = await getPublicClient();
      return await operation(client);
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[rpcClient] Operation failed, trying next RPC...`);
      currentClientIndex = (currentClientIndex + 1) % RPC_ENDPOINTS.length;
      publicClient = null;
    }
  }

  throw lastError || new Error('All RPC endpoints failed');
}

/**
 * Reset the RPC client (useful for testing or manual recovery)
 */
export function resetRpcClient(): void {
  publicClient = null;
  currentClientIndex = 0;
}

/**
 * Get current RPC URL being used
 */
export function getCurrentRpcUrl(): string {
  return RPC_ENDPOINTS[currentClientIndex];
}
