import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink, Coins, TrendingUp } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getTxExplorerUrl } from '@/lib/networkConfig'

interface PlatformAllocation {
  id: string
  agent_id: string
  token_address: string
  platform_amount: number
  vault_address: string
  allocation_tx_hash: string | null
  status: string
  error_message: string | null
  created_at: string
  completed_at: string | null
  agents: {
    name: string
    symbol: string
  }
}

export function PlatformAllocationsList() {
  const [allocations, setAllocations] = useState<PlatformAllocation[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAllocations: 0,
    completedAllocations: 0,
    totalTokensAllocated: 0,
    successRate: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    loadAllocations()
  }, [])

  const loadAllocations = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('platform_allocations')
        .select(`
          *,
          agents (
            name,
            symbol
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setAllocations(data || [])

      // Calculate statistics
      const total = data?.length || 0
      const completed = data?.filter(a => a.status === 'completed').length || 0
      const totalTokens = data?.reduce((sum, a) => sum + Number(a.platform_amount), 0) || 0
      const successRate = total > 0 ? (completed / total) * 100 : 0

      setStats({
        totalAllocations: total,
        completedAllocations: completed,
        totalTokensAllocated: totalTokens,
        successRate: Math.round(successRate)
      })

    } catch (error) {
      console.error('Error loading allocations:', error)
      toast({
        title: "Error",
        description: "Failed to load platform allocations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const truncateAddress = (address: string): string => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openTransaction = (txHash: string) => {
    if (txHash) {
      window.open(getTxExplorerUrl(txHash), '_blank')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Coins className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalAllocations}</div>
            <div className="text-sm text-muted-foreground">Total Allocations</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{stats.completedAllocations}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {(stats.totalTokensAllocated / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-sm text-muted-foreground">Tokens Allocated</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Allocations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Platform Token Allocations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Each graduation allocates 4M tokens (2% of 200M LP allocation) to the platform vault
          </p>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No platform allocations found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vault Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{allocation.agents?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {allocation.agents?.symbol || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {(allocation.platform_amount / 1_000_000).toFixed(1)}M {allocation.agents?.symbol || 'tokens'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            2% of LP allocation
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {truncateAddress(allocation.vault_address)}
                        </code>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(allocation.status)}
                        {allocation.error_message && (
                          <div className="text-xs text-red-600 mt-1" title={allocation.error_message}>
                            Error occurred
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.allocation_tx_hash ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTransaction(allocation.allocation_tx_hash!)}
                            className="h-8 px-2"
                          >
                            <code className="text-xs">{truncateAddress(allocation.allocation_tx_hash)}</code>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(allocation.created_at)}
                        </div>
                        {allocation.completed_at && allocation.completed_at !== allocation.created_at && (
                          <div className="text-xs text-muted-foreground">
                            Completed: {formatDate(allocation.completed_at)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}