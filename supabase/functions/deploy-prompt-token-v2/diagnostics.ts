// Deployment diagnostics and troubleshooting utilities
import { createPublicClient, http } from 'https://esm.sh/viem@2.31.7';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';

/**
 * Comprehensive diagnostics for deployment issues
 */
export async function diagnoseDeploymentIssue(
  address: string,
  txHash: string,
  publicClient: any
): Promise<void> {
  console.log('🔍 Diagnosing deployment issue...');

  try {
    // Check transaction
    const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
    console.log('Transaction details:', {
      from: tx.from,
      to: tx.to,
      value: tx.value?.toString(),
      gas: tx.gas?.toString(),
      gasPrice: tx.gasPrice?.toString()
    });

    // Check receipt
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    console.log('Receipt details:', {
      status: receipt.status,
      gasUsed: receipt.gasUsed?.toString(),
      contractAddress: receipt.contractAddress,
      logsCount: receipt.logs.length
    });

    // Check current block
    const block = await publicClient.getBlockNumber();
    console.log('Current block:', block, 'Tx block:', receipt.blockNumber);

    // Try different RPC endpoints
    console.log('Testing alternative RPC...');
    const altClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://base-sepolia-rpc.publicnode.com')
    });
    const altBytecode = await altClient.getBytecode({ address: address as `0x${string}` });
    console.log('Alternative RPC bytecode check:', altBytecode ? 'Found' : 'Not found');

    // Check node synchronization
    const primaryClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://base-sepolia.g.alchemy.com/v2/demo')
    });
    const primaryBlock = await primaryClient.getBlockNumber();
    const secondaryClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://base-sepolia-rpc.publicnode.com')
    });
    const secondaryBlock = await secondaryClient.getBlockNumber();
    
    console.log('RPC sync status:', {
      primary: primaryBlock,
      secondary: secondaryBlock,
      diff: Number(primaryBlock - secondaryBlock)
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
  }
}

/**
 * Test multiple RPC endpoints for reliability
 */
export async function testRPCEndpoints(): Promise<{ primary: boolean; secondary: boolean }> {
  const results = { primary: false, secondary: false };
  
  try {
    const primaryClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://base-sepolia.g.alchemy.com/v2/demo', { timeout: 5000 })
    });
    await primaryClient.getBlockNumber();
    results.primary = true;
    console.log('✅ Primary RPC working');
  } catch (error) {
    console.log('❌ Primary RPC failed:', error.message);
  }

  try {
    const secondaryClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://base-sepolia-rpc.publicnode.com', { timeout: 5000 })
    });
    await secondaryClient.getBlockNumber();
    results.secondary = true;
    console.log('✅ Secondary RPC working');
  } catch (error) {
    console.log('❌ Secondary RPC failed:', error.message);
  }

  return results;
}