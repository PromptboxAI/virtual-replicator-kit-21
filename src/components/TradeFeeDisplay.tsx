import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Info, User, Building } from 'lucide-react'

interface TradeFeeDisplayProps {
  tradeAmount: number
  feePercent?: number
  creatorSplit?: number
  platformSplit?: number
  agentName?: string
  showBreakdown?: boolean
  className?: string
}

export const TradeFeeDisplay: React.FC<TradeFeeDisplayProps> = ({
  tradeAmount,
  feePercent = 0.01, // Default 1%
  creatorSplit = 0.7, // Default 70%
  platformSplit = 0.3, // Default 30%
  agentName = 'Agent',
  showBreakdown = true,
  className = ''
}) => {
  const feeAmount = tradeAmount * feePercent
  const creatorAmount = feeAmount * creatorSplit
  const platformAmount = feeAmount * platformSplit
  const netAmount = tradeAmount - feeAmount

  if (tradeAmount <= 0) {
    return null
  }

  const FeeBreakdown = () => (
    <div className="space-y-3 text-sm">
      <div className="font-medium">Transaction Fee Breakdown</div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Trade Amount:</span>
          <span className="font-mono">{tradeAmount.toFixed(4)} PROMPT</span>
        </div>
        
        <div className="flex justify-between text-red-600">
          <span>Trading Fee ({(feePercent * 100).toFixed(1)}%):</span>
          <span className="font-mono">-{feeAmount.toFixed(4)} PROMPT</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-medium">
          <span>Net Amount:</span>
          <span className="font-mono">{netAmount.toFixed(4)} PROMPT</span>
        </div>
      </div>

      {showBreakdown && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
              Fee Distribution
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{agentName} Creator ({(creatorSplit * 100)}%)</span>
              </div>
              <span className="font-mono text-green-600">
                {creatorAmount.toFixed(4)} PROMPT
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Platform ({(platformSplit * 100)}%)</span>
              </div>
              <span className="font-mono text-blue-600">
                {platformAmount.toFixed(4)} PROMPT
              </span>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-muted rounded-md text-xs text-muted-foreground">
            <p>Trading fees support agent creators and platform development.</p>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Fee Summary - Made wider with better spacing */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">Trading Fee</span>
          </div>
          <span className="font-mono text-sm font-medium">
            {feeAmount.toFixed(4)} PROMPT ({(feePercent * 100).toFixed(1)}%)
          </span>
        </div>
        
        {/* Fee Breakdown - Now shown directly instead of in tooltip */}
        {showBreakdown && (
          <div className="space-y-2 pt-2 border-t border-yellow-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span className="text-xs">{agentName} Creator</span>
                </div>
                <span className="font-mono text-green-600 text-xs">
                  {creatorAmount.toFixed(4)} PROMPT
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span className="text-xs">Platform</span>
                </div>
                <span className="font-mono text-blue-600 text-xs">
                  {platformAmount.toFixed(4)} PROMPT
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Split:</span>
              <Badge variant="outline" className="text-xs">
                {(creatorSplit * 100)}% / {(platformSplit * 100)}%
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Net Amount Display - Made more prominent */}
      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium">Amount after fees:</span>
        <span className="font-mono text-lg font-bold">{netAmount.toFixed(4)} PROMPT</span>
      </div>
    </div>
  )
}

// Note: Fee configuration is now handled by useAgentTokens hook
// This component receives fee data as props