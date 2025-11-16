import { useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import Big from 'big.js';

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost: string; // In ETH
  totalCostUSD?: string;
}

/**
 * Hook for estimating gas costs with fallback handling
 */
export function useGasEstimation() {
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const estimateGas = useCallback(async (
    to: string,
    data: string,
    value?: bigint,
    ethPriceUSD: number = 2000
  ): Promise<GasEstimate | null> => {
    if (!publicClient) {
      setError('No public client available');
      return null;
    }

    setEstimating(true);
    setError(null);

    try {
      // Estimate gas limit with fallback
      let gasLimit: bigint;
      try {
        gasLimit = await publicClient.estimateGas({
          to: to as `0x${string}`,
          data: data as `0x${string}`,
          value: value || 0n
        });
        // Add 20% buffer for safety
        gasLimit = gasLimit * 120n / 100n;
      } catch (err) {
        console.warn('Gas estimation failed, using fallback', err);
        // Fallback to reasonable default
        gasLimit = 300000n; // 300k gas
      }

      // Get current gas price with fallback
      let gasPrice: bigint;
      let maxFeePerGas: bigint | undefined;
      let maxPriorityFeePerGas: bigint | undefined;

      try {
        // Try EIP-1559 first
        const feeData = await publicClient.estimateFeesPerGas();
        maxFeePerGas = feeData.maxFeePerGas || 0n;
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
        gasPrice = maxFeePerGas;
      } catch (err) {
        console.warn('EIP-1559 fee estimation failed, using legacy', err);
        // Fallback to legacy gas price
        gasPrice = await publicClient.getGasPrice();
      }

      // Calculate total cost in ETH
      const totalCostWei = gasLimit * gasPrice;
      const totalCostETH = Big(totalCostWei.toString()).div('1e18');
      const totalCostUSD = totalCostETH.times(ethPriceUSD);

      return {
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        totalCost: totalCostETH.toFixed(6),
        totalCostUSD: totalCostUSD.toFixed(2)
      };
    } catch (err: any) {
      console.error('Gas estimation error:', err);
      setError(err.message || 'Failed to estimate gas');
      
      // Return conservative estimate as fallback
      return {
        gasLimit: 500000n,
        gasPrice: 50000000000n, // 50 gwei
        totalCost: '0.025', // Conservative estimate
        totalCostUSD: (0.025 * ethPriceUSD).toFixed(2)
      };
    } finally {
      setEstimating(false);
    }
  }, [publicClient]);

  return {
    estimateGas,
    estimating,
    error
  };
}
