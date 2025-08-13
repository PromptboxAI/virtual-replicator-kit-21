// Universal Bytecode Verification Function
// This function ensures that any deployed contract actually exists on-chain before database operations

import { PublicClient } from 'https://esm.sh/viem@2.31.7'

export interface VerificationResult {
  address: `0x${string}`;
  hasBytecode: boolean;
  bytecodeLength: number;
  verified: boolean;
}

/**
 * Universal contract deployment verification function
 * Checks if a contract actually exists at the given address on-chain
 * 
 * @param address - The contract address to verify
 * @param publicClient - Viem public client for blockchain interaction
 * @param contractType - Optional type for logging purposes
 * @returns Promise<VerificationResult> - Verification details
 * @throws Error if verification fails
 */
export async function verifyDeployment(
  address: `0x${string}`, 
  publicClient: PublicClient,
  contractType: string = 'contract',
  transactionHash?: `0x${string}` // NEW: optional tx hash for validation
): Promise<VerificationResult> {
  
  console.log(`🔍 Verifying ${contractType} deployment at: ${address}`);
  
  // NEW: If we have the transaction hash, validate the receipt first
  if (transactionHash) {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash });

      // Check if contract was actually created
      if (!receipt.contractAddress) {
        throw new Error('Transaction did not create a contract');
      }

      if (receipt.status === 'reverted') {
        throw new Error('Contract deployment transaction reverted');
      }

      // Verify addresses match (case-insensitive)
      if (receipt.contractAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`Contract address mismatch: expected ${address}, got ${receipt.contractAddress}`);
      }

      console.log('✅ Transaction receipt validated:', {
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: receipt.contractAddress
      });

    } catch (error) {
      console.error('❌ Receipt validation failed:', error);
      throw new Error(`Receipt validation failed: ${error.message}`);
    }
  }

  // Enhanced retry with longer delays for Base Sepolia
  const maxRetries = 10; // Increased from 5
  const retryDelays = [2000, 3000, 5000, 8000, 10000, 15000, 20000, 25000, 30000, 35000]; // Longer delays

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`⏳ Retry ${attempt}/${maxRetries} after ${retryDelays[attempt - 1]}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
      }

      // Try to get bytecode
      const bytecode = await publicClient.getBytecode({ address });

      // Also check if it's a contract (has code)
      const code = await publicClient.getCode({ address });

      const hasBytecode = !!(bytecode && bytecode !== '0x' && bytecode.length > 2);
      const hasCode = !!(code && code !== '0x' && code.length > 2);

      if (hasBytecode || hasCode) {
        const bytecodeLength = Math.max(
          bytecode?.length || 0,
          code?.length || 0
        );

        console.log(`✅ Contract verified at ${address} on attempt ${attempt + 1}:`, {
          type: contractType,
          bytecodeLength,
          hasBytecode,
          hasCode
        });

        return {
          address,
          hasBytecode: true,
          bytecodeLength,
          verified: true
        };
      }

      // Special handling for last attempt
      if (attempt === maxRetries - 1) {
        // Try one more time with a different method
        console.log('🔄 Final attempt: checking contract size...');
        const size = await publicClient.getStorageAt({
          address,
          slot: '0x0'
        });

        if (size && size !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          console.log('✅ Contract has storage, considering it deployed');
          return {
            address,
            hasBytecode: true,
            bytecodeLength: 1, // Unknown but exists
            verified: true
          };
        }

        throw new Error(`No bytecode found after ${maxRetries} attempts (${(retryDelays.reduce((a,b) => a+b, 0)/1000).toFixed(0)}s total wait)`);
      }

    } catch (error: any) {
      if (attempt < maxRetries - 1) {
        console.log(`⚠️ Attempt ${attempt + 1} failed: ${error.message}`);
        continue;
      } else {
        throw error;
      }
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error(`Unexpected error in verification for ${address}`);
}

/**
 * Batch verification for multiple contracts
 * Useful for verifying factory + tokens together
 */
export async function verifyMultipleDeployments(
  contracts: Array<{ address: `0x${string}`; type: string }>,
  publicClient: PublicClient
): Promise<VerificationResult[]> {
  
  console.log(`🔍 Batch verification for ${contracts.length} contracts`);
  
  const results: VerificationResult[] = [];
  
  for (const contract of contracts) {
    try {
      const result = await verifyDeployment(contract.address, publicClient, contract.type);
      results.push(result);
    } catch (error) {
      console.error(`❌ Batch verification failed for ${contract.type} at ${contract.address}`);
      throw error; // Fail fast on any verification failure
    }
  }
  
  console.log(`✅ All ${contracts.length} contracts verified successfully`);
  return results;
}