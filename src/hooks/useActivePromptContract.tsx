import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useActivePromptContract() {
  const { data: contract, isLoading } = useQuery({
    queryKey: ['active-prompt-contract'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployed_contracts')
        .select('contract_address, transaction_hash, created_at')
        .eq('contract_type', 'PROMPT')
        .eq('network', 'base_sepolia')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
  
  return {
    address: contract?.contract_address || null,
    txHash: contract?.transaction_hash,
    isLoading
  };
}
