import { useState, useEffect, createContext, useContext } from 'react';

export type StatusLevel = 'operational' | 'degraded' | 'outage';

export interface ServiceStatus {
  name: string;
  status: StatusLevel;
  description?: string;
}

export interface SystemStatus {
  overall: StatusLevel;
  services: ServiceStatus[];
  lastUpdated: Date;
}

// Dummy data for now - can be replaced with real API calls later
const getSystemStatus = (): SystemStatus => {
  return {
    overall: 'operational',
    services: [
      { name: 'API', status: 'operational', description: 'All API endpoints responding normally' },
      { name: 'Web Application', status: 'operational', description: 'Frontend application running smoothly' },
      { name: 'Database', status: 'operational', description: 'Database connections stable' },
      { name: 'Authentication', status: 'operational', description: 'Login and auth services working' },
      { name: 'AI Services', status: 'operational', description: 'AI processing available' },
      { name: 'File Storage', status: 'operational', description: 'File uploads and downloads working' },
    ],
    lastUpdated: new Date(),
  };
};

const SystemStatusContext = createContext<SystemStatus | null>(null);

export const SystemStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<SystemStatus>(getSystemStatus());

  useEffect(() => {
    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      setStatus(getSystemStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SystemStatusContext.Provider value={status}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = () => {
  const context = useContext(SystemStatusContext);
  if (!context) {
    // Return default status if not in provider
    return getSystemStatus();
  }
  return context;
};

export const getStatusColor = (status: StatusLevel): string => {
  switch (status) {
    case 'operational':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-orange-500';
    case 'outage':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStatusText = (status: StatusLevel): string => {
  switch (status) {
    case 'operational':
      return 'All Systems Operational';
    case 'degraded':
      return 'Partial System Outage';
    case 'outage':
      return 'Major System Outage';
    default:
      return 'Status Unknown';
  }
};
