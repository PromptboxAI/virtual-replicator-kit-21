import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Info,
  User,
  Building,
  RefreshCw
} from 'lucide-react'

interface Transaction {
  id: string
  agent_id: string
  transaction_type: 'buy' | 'sell'
  prompt_amount: number
  token_amount: number
  price_per_token: number
  transaction_hash?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  agents?: {
    name: string
    symbol: string
  }
}

interface RevenueDistribution {
  id: string
  agent_id: string
  transaction_hash?: string
  total_revenue: number
  fee_amount: number
  creator_amount: number
  platform_amount: number
  status: string
  created_at: string
  agents?: {
    name: string
  }
}

export const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [distributions, setDistributions] = useState<RevenueDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchTransactions = async () => {
    if (!user) return

    const { data: txData } = await supabase
      .from('agent_token_transactions')
      .select(`
        *,
        agents (name, symbol)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: distData } = await supabase
      .from('revenue_distributions')
      .select(`
        *,
        agents (name)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    setTransactions((txData || []) as Transaction[])
    setDistributions(distData || [])
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchTransactions()
      setLoading(false)
    }

    loadData()
  }, [user])

  const getFeeForTransaction = (tx: Transaction): RevenueDistribution | null => {
    return distributions.find(d => 
      d.transaction_hash === tx.transaction_hash ||
      (d.agent_id === tx.agent_id && 
       Math.abs(new Date(d.created_at).getTime() - new Date(tx.created_at).getTime()) < 60000)
    ) || null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const FeeBreakdown = ({ fee }: { fee: RevenueDistribution }) => (
    <div className="space-y-2 text-sm">
      <div className="font-medium">Fee Breakdown</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Total Fee:</span>
          <span className="font-mono">{fee.fee_amount.toFixed(4)} PROMPT</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Creator:</span>
          </div>
          <span className="font-mono text-green-600">
            {fee.creator_amount.toFixed(4)} PROMPT
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            <span>Platform:</span>
          </div>
          <span className="font-mono text-blue-600">
            {fee.platform_amount.toFixed(4)} PROMPT
          </span>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Your trading activity with fee breakdowns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const fee = getFeeForTransaction(tx)
              const feePercent = fee ? (fee.fee_amount / tx.prompt_amount) * 100 : 1.0
              
              return (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {tx.agents?.name || 'Unknown'}
                    <div className="text-xs text-muted-foreground">
                      {tx.agents?.symbol}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {tx.transaction_type === 'buy' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={tx.transaction_type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                        {tx.transaction_type.toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {tx.prompt_amount.toFixed(4)} PROMPT
                  </TableCell>
                  <TableCell className="font-mono">
                    {tx.token_amount.toFixed(6)}
                  </TableCell>
                  <TableCell className="font-mono">
                    ${tx.price_per_token.toFixed(6)}
                  </TableCell>
                  <TableCell>
                    {fee ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <span className="font-mono text-sm">
                                {fee.fee_amount.toFixed(4)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {feePercent.toFixed(1)}%
                              </Badge>
                              <Info className="h-3 w-3" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <FeeBreakdown fee={fee} />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        ~{(tx.prompt_amount * 0.01).toFixed(4)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tx.status)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {tx.transaction_hash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://basescan.org/tx/${tx.transaction_hash}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}