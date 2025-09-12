import { Shield, Database } from "lucide-react";

export interface DeploymentModeIndicatorProps {
  mode: 'database' | 'smart_contract';
  className?: string;
}

export const DeploymentModeIndicator = ({ 
  mode, 
  className = "" 
}: DeploymentModeIndicatorProps) => {
  if (mode === 'smart_contract') {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium ${className}`}>
        <Shield className="h-3 w-3" />
        Smart Contract
      </div>
    );
  }
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium ${className}`}>
      <Database className="h-3 w-3" />
      Database
    </div>
  );
};