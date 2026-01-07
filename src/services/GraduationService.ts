/**
 * Graduation Service - Centralized graduation threshold logic
 * Handles both database mode (fixed 42K) and smart_contract mode (dynamic USD)
 */

import { supabase } from '@/integrations/supabase/client';
import { getGraduationThreshold, type GraduationConfig } from '@/lib/graduationConfig';

interface CachedThreshold {
  threshold: number;
  timestamp: number;
  agentId: string;
}

// Cache for agent-specific thresholds (5 minute TTL)
const CACHE_TTL = 5 * 60 * 1000;
const thresholdCache = new Map<string, CachedThreshold>();

/**
 * Get graduation threshold for a specific agent
 * Uses agent's stored pricing config or falls back to system defaults
 */
export async function getAgentGraduationThreshold(agentId: string): Promise<number> {
  // Check cache first
  const cached = thresholdCache.get(agentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.threshold;
  }

  try {
    // Fetch agent's pricing configuration
    const { data: agent, error } = await supabase
      .from('agents')
      .select('graduation_mode, target_market_cap_usd, created_prompt_usd_rate')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      console.error('Failed to fetch agent graduation config:', error);
      return 42160; // V7: Fallback to updated default
    }

    const config: GraduationConfig = {
      mode: (agent.graduation_mode as 'database' | 'smart_contract') || 'database',
      targetMarketCapUSD: agent.target_market_cap_usd || 65000,
      promptUsdRate: agent.created_prompt_usd_rate || null
    };

    const threshold = getGraduationThreshold(config);

    // Cache the result
    thresholdCache.set(agentId, {
      threshold,
      timestamp: Date.now(),
      agentId
    });

    return threshold;
  } catch (error) {
    console.error('Error calculating graduation threshold:', error);
    return 42160; // V7: Fallback to updated default
  }
}

/**
 * Get graduation progress percentage for an agent
 */
export async function getGraduationProgress(agentId: string, promptRaised: number): Promise<number> {
  const threshold = await getAgentGraduationThreshold(agentId);
  return Math.min((promptRaised / threshold) * 100, 100);
}

/**
 * Check if agent has graduated
 */
export async function hasGraduated(agentId: string, promptRaised: number): Promise<boolean> {
  const threshold = await getAgentGraduationThreshold(agentId);
  return promptRaised >= threshold;
}

/**
 * Get formatted graduation threshold display
 */
export async function getGraduationThresholdDisplay(agentId: string): Promise<string> {
  const threshold = await getAgentGraduationThreshold(agentId);
  return threshold.toLocaleString();
}

/**
 * Clear cache for a specific agent (call after graduation or config changes)
 */
export function clearAgentCache(agentId: string): void {
  thresholdCache.delete(agentId);
}

/**
 * Clear all cached thresholds
 */
export function clearAllCache(): void {
  thresholdCache.clear();
}
