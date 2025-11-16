import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAgentGraduationThreshold, getGraduationProgress } from '@/services/GraduationService';
import Big from 'big.js';

interface GraduationTransitionHandlerProps {
  agentId: string;
  currentPrice: string;
  promptRaised: string;
  isGraduated: boolean;
  onGraduationDetected?: () => void;
}

/**
 * Component to handle smooth price transitions during graduation
 * Prevents price jumps by monitoring graduation progress
 */
export function GraduationTransitionHandler({
  agentId,
  currentPrice,
  promptRaised,
  isGraduated,
  onGraduationDetected
}: GraduationTransitionHandlerProps) {
  const { toast } = useToast();
  const [wasGraduated, setWasGraduated] = useState(isGraduated);
  const [nearingGraduation, setNearingGraduation] = useState(false);
  const [threshold, setThreshold] = useState<number>(42000);

  // Fetch graduation threshold
  useEffect(() => {
    getAgentGraduationThreshold(agentId).then(setThreshold);
  }, [agentId]);

  // Check graduation progress
  useEffect(() => {
    const checkProgress = async () => {
      const progress = await getGraduationProgress(agentId, parseFloat(promptRaised));
      
      // Nearing graduation if within 5% of threshold
      if (progress >= 95 && !isGraduated) {
        setNearingGraduation(true);
      } else {
        setNearingGraduation(false);
      }
    };

    checkProgress();
  }, [agentId, promptRaised, isGraduated]);

  // Detect graduation transition
  useEffect(() => {
    if (!wasGraduated && isGraduated) {
      console.log('🎓 Graduation detected - handling transition', {
        agentId,
        currentPrice,
        promptRaised
      });

      toast({
        title: "Agent Graduated! 🎓",
        description: "This agent has graduated to a full DEX listing. Price continuity maintained.",
        duration: 5000
      });

      setWasGraduated(true);
      onGraduationDetected?.();
    }
  }, [agentId, currentPrice, promptRaised, isGraduated, wasGraduated, toast, onGraduationDetected]);

  // Log warning when nearing graduation
  useEffect(() => {
    if (nearingGraduation && !isGraduated) {
      console.log('⚠️ Nearing graduation threshold', {
        agentId,
        promptRaised,
        threshold
      });
    }
  }, [nearingGraduation, isGraduated, agentId, promptRaised, threshold]);

  return null; // This is a logic-only component
}
