import { Badge } from "@/components/ui/badge";
import { Database, Link2, Rocket, Loader2, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AgentDeploymentBadgeProps {
  deploymentStatus: 'not_deployed' | 'pending' | 'deploying' | 'deployed' | 'deployment_failed' | 'failed';
  networkEnvironment?: 'testnet' | 'mainnet';
  chainId?: number;
  showTooltip?: boolean;
}

export function AgentDeploymentBadge({ 
  deploymentStatus, 
  networkEnvironment = 'testnet',
  chainId,
  showTooltip = true 
}: AgentDeploymentBadgeProps) {
  
  const getBadgeConfig = () => {
    switch (deploymentStatus) {
      case 'not_deployed':
        return {
          icon: Database,
          label: 'Database Only',
          variant: 'secondary' as const,
          tooltip: 'This agent exists only in the database (test mode)'
        };
      case 'pending':
      case 'deploying':
        return {
          icon: Loader2,
          label: 'Deploying...',
          variant: 'outline' as const,
          tooltip: 'Smart contract deployment in progress',
          animate: true
        };
      case 'deployed':
        const networkLabel = networkEnvironment === 'mainnet' ? 'Base Mainnet' : 'Base Sepolia';
        return {
          icon: networkEnvironment === 'mainnet' ? Rocket : Link2,
          label: networkLabel,
          variant: networkEnvironment === 'mainnet' ? 'default' as const : 'outline' as const,
          tooltip: `Deployed on ${networkLabel} (Chain ID: ${chainId || (networkEnvironment === 'mainnet' ? 8453 : 84532)})`
        };
      case 'deployment_failed':
        return {
          icon: XCircle,
          label: 'Deployment Failed',
          variant: 'destructive' as const,
          tooltip: 'Contract deployment failed - please try again'
        };
      default:
        return {
          icon: Database,
          label: 'Unknown',
          variant: 'secondary' as const,
          tooltip: 'Unknown deployment status'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const badgeContent = (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
