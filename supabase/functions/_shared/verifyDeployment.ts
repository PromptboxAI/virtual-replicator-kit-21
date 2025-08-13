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
  contractType: string = 'contract'
): Promise<VerificationResult> {
  
  console.log(`🔍 Verifying ${contractType} deployment at: ${address}`);
  
  // Add retry mechanism with delays to handle timing issues
  const maxRetries = 5;
  const retryDelays = [1000, 2000, 3000, 5000, 8000]; // Exponential backoff
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait before each attempt (except the first)
      if (attempt > 0) {
        console.log(`⏳ Waiting ${retryDelays[attempt - 1]}ms before retry ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
      }
      
      // Get bytecode from the contract address
      const bytecode = await publicClient.getBytecode({ address });
      
      const hasBytecode = !!(bytecode && bytecode !== '0x');
      const bytecodeLength = bytecode?.length || 0;
      
      const result: VerificationResult = {
        address,
        hasBytecode,
        bytecodeLength,
        verified: hasBytecode
      };
      
      if (!hasBytecode) {
        if (attempt < maxRetries - 1) {
          console.log(`⚠️ No bytecode found at ${address} on attempt ${attempt + 1}, retrying...`);
          continue; // Try again
        } else {
          console.error(`❌ DEPLOYMENT VERIFICATION FAILED: No bytecode found at ${address} after ${maxRetries} attempts`);
          throw new Error(`❌ DEPLOYMENT VERIFICATION FAILED: No bytecode at ${address} after ${maxRetries} verification attempts. Contract may not have deployed successfully.`);
        }
      }
      
      console.log(`✅ Contract verified at ${address} on attempt ${attempt + 1}:`, {
        type: contractType,
        bytecodeLength,
        hasBytecode
      });
      
      return result;
      
    } catch (error: any) {
      if (attempt < maxRetries - 1) {
        console.log(`⚠️ Verification attempt ${attempt + 1} failed for ${address}: ${error.message}, retrying...`);
        continue;
      } else {
        console.error(`❌ Final verification error for ${address} after ${maxRetries} attempts:`, error.message);
        throw new Error(`Contract verification failed at ${address} after ${maxRetries} attempts: ${error.message}`);
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