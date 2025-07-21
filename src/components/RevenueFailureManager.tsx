import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  User,
  Building
} from 'lucide-react'

interface RevenueFailure {
  id: string
  agent_id: string
  distribution_id: string | null
  recipient_type: 'creator' | 'platform'
  intended_recipient: string
  amount: number
  failure_reason: string
  retry_count: number
  max_retries: number
  status: 'pending' | 'retrying' | 'resolved' | 'abandoned'
  last_retry_at: string | null
  resolved_at: string | null
  created_at: string
  agents?: { name: string }
}

interface RevenueDistribution {
  id: string
  agent_id: string
  total_revenue: number
  fee_amount: number
  creator_amount: number
  platform_amount: number
  status: string
  has_failures: boolean
  retry_count: number
  created_at: string
  agents?: { name: string }
}

export const RevenueFailureManager: React.FC = () => {
  const [failures, setFailures] = useState<RevenueFailure[]>([])
  const [distributions, setDistributions] = useState<RevenueDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchFailures = async () => {
    const { data, error } = await supabase
      .from('revenue_failures')
      .select(`
        *,
        agents (name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Error fetching failures",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setFailures((data || []) as RevenueFailure[])
    }
  }

  const fetchDistributions = async () => {
    const { data, error } = await supabase
      .from('revenue_distributions')
      .select(`
        *,
        agents (name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      toast({
        title: "Error fetching distributions",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setDistributions(data || [])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchFailures(), fetchDistributions()])
      setLoading(false)
    }
    
    loadData()
  }, [])

  const retryPayout = async (failureId: string) => {
    setRetryingIds(prev => new Set(prev).add(failureId))
    
    try {
      const { data, error } = await supabase.functions.invoke('retry-failed-payouts', {
        body: {
          action: 'retry_single',
          failureId
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.success) {
        toast({
          title: "Retry successful",
          description: data.message,
        })
        await fetchFailures()
      } else {
        toast({
          title: "Retry failed",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error retrying payout",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setRetryingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(failureId)
        return newSet
      })
    }
  }

  const retryAllPending = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('retry-failed-payouts', {
        body: {
          action: 'retry_all_pending'
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Bulk retry completed",
        description: data.message,
      })
      await fetchFailures()
    } catch (error) {
      toast({
        title: "Error retrying payouts",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      retrying: { variant: "outline" as const, icon: RefreshCw, color: "text-blue-600" },
      resolved: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      abandoned: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" }
    }
    
    const config = variants[status as keyof typeof variants] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const pendingFailures = failures.filter(f => f.status === 'pending' || f.status === 'retrying')
  const resolvedFailures = failures.filter(f => f.status === 'resolved')
  const abandonedFailures = failures.filter(f => f.status === 'abandoned')

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Revenue Failure Manager
          </CardTitle>
          <CardDescription>
            Monitor and retry failed revenue distributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">{pendingFailures.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Resolved</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{resolvedFailures.length}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Abandoned</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{abandonedFailures.length}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Failed Amount</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ${pendingFailures.reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>

          {pendingFailures.length > 0 && (
            <div className="mb-4">
              <Button onClick={retryAllPending} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry All Pending ({pendingFailures.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="failures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="failures">Failed Payouts</TabsTrigger>
          <TabsTrigger value="distributions">Recent Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="failures">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payouts</CardTitle>
              <CardDescription>Individual payout failures with retry options</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failures.map((failure) => (
                    <TableRow key={failure.id}>
                      <TableCell className="font-medium">
                        {failure.agents?.name || failure.agent_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {failure.recipient_type === 'creator' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Building className="h-4 w-4" />
                          )}
                          {failure.recipient_type}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {failure.intended_recipient.slice(0, 12)}...
                      </TableCell>
                      <TableCell>${failure.amount.toFixed(4)}</TableCell>
                      <TableCell>{getStatusBadge(failure.status)}</TableCell>
                      <TableCell>
                        {failure.retry_count}/{failure.max_retries}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {failure.failure_reason}
                      </TableCell>
                      <TableCell>
                        {(failure.status === 'pending' || failure.status === 'retrying') && 
                         failure.retry_count < failure.max_retries && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryPayout(failure.id)}
                            disabled={retryingIds.has(failure.id)}
                          >
                            {retryingIds.has(failure.id) ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              'Retry'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {failures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No failed payouts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Distributions</CardTitle>
              <CardDescription>All revenue distributions with status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Fee Amount</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell className="font-medium">
                        {dist.agents?.name || dist.agent_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>${dist.total_revenue.toFixed(2)}</TableCell>
                      <TableCell>${dist.fee_amount.toFixed(4)}</TableCell>
                      <TableCell>${dist.creator_amount.toFixed(4)}</TableCell>
                      <TableCell>${dist.platform_amount.toFixed(4)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(dist.status)}
                          {dist.has_failures && (
                            <Badge variant="destructive" className="text-xs">
                              Has Failures
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(dist.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {distributions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No distributions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}