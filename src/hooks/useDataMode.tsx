import { useState, useEffect } from 'react';

export type DataMode = 'mock' | 'real';

export const useDataMode = () => {
  const [dataMode, setDataMode] = useState<DataMode>('mock');
  
  useEffect(() => {
    const envMode = import.meta.env.VITE_USE_MOCK_DATAFEED;
    setDataMode(envMode === 'true' ? 'mock' : 'real');
  }, []);
  
  const isMockMode = dataMode === 'mock';
  const isRealMode = dataMode === 'real';
  
  return {
    dataMode,
    isMockMode,
    isRealMode,
    toggleMode: (newMode: DataMode) => setDataMode(newMode)
  };
};
