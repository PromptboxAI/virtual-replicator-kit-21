/**
 * V8 Agent Validation Utilities
 * 
 * Validates V8 agent configuration before database insertion
 * Ensures all required V8 flags and constants are set correctly
 * 
 * Economic Model (Original V7):
 * - P0 (Starting Price): 0.00004 PROMPT per token
 * - P1 (Graduation Price): 0.0003 PROMPT per token
 */

import { V8_CONSTANTS } from './contractsV8';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface V8AgentRecord {
  id?: string;
  name?: string;
  symbol?: string;
  is_v8?: boolean;
  creation_mode?: string;
  graduation_threshold?: number;
  pricing_model?: string;
  graduation_mode?: string;
  created_p0?: string;
  created_p1?: string;
  prototype_token_address?: string;
  token_address?: string;
  token_contract_address?: string;
  deployment_tx_hash?: string;
  creator_wallet_address?: string;
  description?: string;
  project_pitch?: string;
}

/**
 * Validate V8 agent configuration
 * Returns validation result with errors and warnings
 */
export function validateV8Agent(agent: V8AgentRecord): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ========================================
  // Required V8 Flags
  // ========================================
  if (agent.is_v8 !== true) {
    errors.push('is_v8 must be true');
  }
  
  if (agent.graduation_threshold !== V8_CONSTANTS.GRADUATION_THRESHOLD) {
    errors.push(`graduation_threshold must be ${V8_CONSTANTS.GRADUATION_THRESHOLD}, got ${agent.graduation_threshold}`);
  }
  
  if (agent.pricing_model !== 'bonding_curve_v8') {
    errors.push(`pricing_model must be 'bonding_curve_v8', got '${agent.pricing_model}'`);
  }
  
  if (agent.graduation_mode !== 'on_chain') {
    errors.push(`graduation_mode must be 'on_chain', got '${agent.graduation_mode}'`);
  }
  
  if (agent.creation_mode !== 'smart_contract') {
    errors.push(`creation_mode must be 'smart_contract', got '${agent.creation_mode}'`);
  }

  // ========================================
  // V8 Constants
  // ========================================
  if (agent.created_p0 !== V8_CONSTANTS.P0_STRING) {
    errors.push(`created_p0 must be '${V8_CONSTANTS.P0_STRING}', got '${agent.created_p0}'`);
  }
  
  if (agent.created_p1 !== V8_CONSTANTS.P1_STRING) {
    errors.push(`created_p1 must be '${V8_CONSTANTS.P1_STRING}', got '${agent.created_p1}'`);
  }

  // ========================================
  // Required Addresses (for deployed agents)
  // ========================================
  if (!agent.prototype_token_address) {
    errors.push('prototype_token_address is required');
  }
  
  if (!agent.deployment_tx_hash) {
    errors.push('deployment_tx_hash is required');
  }

  // ========================================
  // Address Consistency
  // ========================================
  if (agent.prototype_token_address) {
    const proto = agent.prototype_token_address.toLowerCase();
    
    if (agent.token_address && agent.token_address.toLowerCase() !== proto) {
      errors.push('token_address must match prototype_token_address');
    }
    
    if (agent.token_contract_address && agent.token_contract_address.toLowerCase() !== proto) {
      errors.push('token_contract_address must match prototype_token_address');
    }
  }

  // ========================================
  // Data Quality
  // ========================================
  const debugPatterns = [
    'transformPromptboxTokenToAgent',
    'console.log',
    'TODO',
    'FIXME',
    'undefined',
  ];

  for (const pattern of debugPatterns) {
    if (agent.description?.includes(pattern)) {
      warnings.push(`description contains debug text: '${pattern}'`);
    }
    if (agent.project_pitch?.includes(pattern)) {
      warnings.push(`project_pitch contains debug text: '${pattern}'`);
    }
  }

  // ========================================
  // Required Fields
  // ========================================
  if (!agent.name || agent.name.trim() === '') {
    errors.push('name is required');
  }
  
  if (!agent.symbol || agent.symbol.trim() === '') {
    errors.push('symbol is required');
  }
  
  if (!agent.creator_wallet_address) {
    errors.push('creator_wallet_address is required');
  }

  return { 
    valid: errors.length === 0, 
    errors, 
    warnings 
  };
}

/**
 * Validate V8 agent input before deployment
 * Less strict than full validation (doesn't require on-chain data yet)
 */
export function validateV8AgentInput(input: {
  name?: string;
  symbol?: string;
  creator_wallet_address?: string;
  description?: string;
  project_pitch?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.name || input.name.trim() === '') {
    errors.push('name is required');
  }
  
  if (!input.symbol || input.symbol.trim() === '') {
    errors.push('symbol is required');
  }
  
  if (!input.creator_wallet_address) {
    errors.push('creator_wallet_address is required');
  }

  // Validate no debug text
  const debugPatterns = ['console.log', 'TODO', 'FIXME', 'undefined'];
  for (const pattern of debugPatterns) {
    if (input.description?.includes(pattern)) {
      warnings.push(`description contains debug text: '${pattern}'`);
    }
    if (input.project_pitch?.includes(pattern)) {
      warnings.push(`project_pitch contains debug text: '${pattern}'`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Check if an agent record has correct V8 configuration
 */
export function isValidV8Agent(agent: V8AgentRecord): boolean {
  return (
    agent.is_v8 === true &&
    agent.creation_mode === 'smart_contract' &&
    agent.graduation_threshold === V8_CONSTANTS.GRADUATION_THRESHOLD &&
    agent.pricing_model === 'bonding_curve_v8' &&
    agent.graduation_mode === 'on_chain' &&
    !!agent.prototype_token_address
  );
}

/**
 * Get V8 defaults for agent creation
 */
export function getV8Defaults() {
  return {
    is_v8: true,
    creation_mode: 'smart_contract',
    graduation_threshold: V8_CONSTANTS.GRADUATION_THRESHOLD,
    pricing_model: 'bonding_curve_v8',
    graduation_mode: 'on_chain',
    created_p0: V8_CONSTANTS.P0_STRING,
    created_p1: V8_CONSTANTS.P1_STRING,
    total_supply: V8_CONSTANTS.TOTAL_SUPPLY,
    chain_id: V8_CONSTANTS.CHAIN_ID,
    network_environment: 'testnet',
  };
}
