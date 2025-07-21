import { Log, TransactionReceipt } from 'viem';

/**
 * Transaction analysis utilities for slippage monitoring
 */

export interface TransactionAnalysis {
  actualTokensReceived?: number;
  actualPromptReceived?: number;
  slippageExperienced?: number;
  priceImpact?: number;
  gasEfficiency?: number;
}

export interface SlippageReport {
  expectedAmount: number;
  actualAmount: number;
  slippagePercentage: number;
  slippageProtectionUsed: string;
  timestamp: string;
  txHash: string;
  gasUsed: bigint;
  gasPrice: bigint;
}

/**
 * Parse agent token transaction logs to extract actual amounts
 * TODO: Implement based on actual contract event signatures
 */
export function parseAgentTokenLogs(logs: Log[]): TransactionAnalysis {
  // Example event signatures (update based on actual contract)
  const TOKEN_PURCHASED_EVENT = '0x...'; // keccak256("TokenPurchased(address,uint256,uint256)")
  const TOKEN_SOLD_EVENT = '0x...'; // keccak256("TokenSold(address,uint256,uint256)")
  
  try {
    for (const log of logs) {
      // Viem Log type may not have topics directly accessible
      // TODO: Use proper event decoding with contract ABI
      const logData = log as any; // Temporary fix for types
      
      if (logData.topics?.[0] === TOKEN_PURCHASED_EVENT) {
        // Parse TokenPurchased event
        // const [buyer, promptSpent, tokensReceived] = decodeEventLog(...)
        // return { actualTokensReceived: Number(formatEther(tokensReceived)) };
      }
      
      if (logData.topics?.[0] === TOKEN_SOLD_EVENT) {
        // Parse TokenSold event  
        // const [seller, tokensSold, promptReceived] = decodeEventLog(...)
        // return { actualPromptReceived: Number(formatEther(promptReceived)) };
      }
    }
  } catch (error) {
    console.warn('Failed to parse transaction logs:', error);
  }
  
  return {};
}

/**
 * Calculate slippage experienced vs expected
 */
export function calculateSlippage(expected: number, actual: number): number {
  if (expected === 0) return 0;
  return ((expected - actual) / expected) * 100;
}

/**
 * Generate comprehensive slippage report
 */
export function generateSlippageReport(
  receipt: TransactionReceipt,
  expectedAmount: number,
  slippageProtectionUsed: string
): SlippageReport {
  const analysis = parseAgentTokenLogs(receipt.logs);
  const actualAmount = analysis.actualTokensReceived || analysis.actualPromptReceived || 0;
  
  return {
    expectedAmount,
    actualAmount,
    slippagePercentage: calculateSlippage(expectedAmount, actualAmount),
    slippageProtectionUsed,
    timestamp: new Date().toISOString(),
    txHash: receipt.transactionHash,
    gasUsed: receipt.gasUsed,
    gasPrice: receipt.effectiveGasPrice || 0n,
  };
}

/**
 * Log slippage report to console with formatting
 */
export function logSlippageReport(report: SlippageReport, transactionType: 'buy' | 'sell'): void {
  const icon = transactionType === 'buy' ? '📈' : '📉';
  const slippageColor = Math.abs(report.slippagePercentage) > 1 ? '🔴' : '🟢';
  
  console.group(`${icon} ${transactionType.toUpperCase()} Transaction Analysis`);
  console.log('📋 Expected Amount:', report.expectedAmount);
  console.log('✅ Actual Amount:', report.actualAmount);
  console.log(`${slippageColor} Slippage:`, `${report.slippagePercentage.toFixed(4)}%`);
  console.log('🛡️ Protection Used:', report.slippageProtectionUsed);
  console.log('⛽ Gas Used:', report.gasUsed.toString());
  console.log('💰 Gas Price:', report.gasPrice.toString());
  console.log('🔗 Transaction:', report.txHash);
  console.log('⏰ Timestamp:', report.timestamp);
  console.groupEnd();
}

/**
 * Send slippage data to analytics service (placeholder)
 */
export async function trackSlippage(report: SlippageReport): Promise<void> {
  // TODO: Implement analytics tracking
  // await analytics.track('slippage_experienced', report);
  console.log('📊 Slippage data tracked:', report.slippagePercentage.toFixed(4) + '%');
}