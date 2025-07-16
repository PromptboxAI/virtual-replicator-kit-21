import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppMode } from './useAppMode';

interface TreasuryConfig {
  id: string;
  network: string;
  treasury_address: string;
  is_active: boolean;
}

export const useTreasuryConfig = () => {
  const [treasuryAddress, setTreasuryAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { isTestMode } = useAppMode();

  useEffect(() => {
    fetchTreasuryAddress();
  }, [isTestMode]);

  const fetchTreasuryAddress = async () => {
    try {
      setLoading(true);
      const network = isTestMode ? 'testnet' : 'mainnet';
      
      const { data, error } = await supabase
        .from('treasury_config')
        .select('treasury_address')
        .eq('network', network)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching treasury config:', error);
        // Fallback to hardcoded address
        setTreasuryAddress('0x23d03610584B0f0988A6F9C281a37094D5611388');
        return;
      }

      setTreasuryAddress(data.treasury_address);
    } catch (error) {
      console.error('Error in fetchTreasuryAddress:', error);
      // Fallback to hardcoded address
      setTreasuryAddress('0x23d03610584B0f0988A6F9C281a37094D5611388');
    } finally {
      setLoading(false);
    }
  };

  return {
    treasuryAddress,
    loading,
    refetch: fetchTreasuryAddress
  };
};