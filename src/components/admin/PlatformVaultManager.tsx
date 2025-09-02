import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface VaultData {
  vaultAddress: string
  currentReceiver: string
  totalAllocations: number
  totalTokensReceived: number
  pendingReceiverChange: {
    address: string
    executeTime: string
    canExecute: boolean
    timeRemaining: number
  } | null
}

export function PlatformVaultManager() {
  const [vaultData, setVaultData] = useState<VaultData>({
    vaultAddress: '',
    currentReceiver: '',
    totalAllocations: 0,
    totalTokensReceived: 0,
    pendingReceiverChange: null
  })
  const [newReceiver, setNewReceiver] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadVaultData()
  }, [])

  const loadVaultData = async () => {
    try {
      setLoading(true)

      // Load treasury config
      const { data: config, error: configError } = await supabase
        .from('treasury_config')
        .select('platform_vault_address')
        .eq('network', 'testnet')
        .eq('is_active', true)
        .single()

      if (configError) {
        console.error('Error loading treasury config:', configError)
        return
      }

      // Load allocation statistics
      const { data: allocations, error: allocationsError } = await supabase
        .from('platform_allocations')
        .select('platform_amount, status')
        .eq('status', 'completed')

      if (allocationsError) {
        console.error('Error loading allocations:', allocationsError)
      }

      const totalTokens = allocations?.reduce((sum, a) => sum + Number(a.platform_amount), 0) || 0

      // Get vault status from edge function if vault exists
      let currentReceiver = 'Unknown'
      let pendingChange = null

      if (config?.platform_vault_address && newReceiver) {
        try {
          const { data: statusResponse } = await supabase.functions.invoke('update-vault-receiver', {
            body: { 
              newReceiver, 
              action: 'status',
              vaultAddress: config.platform_vault_address
            }
          })

          if (statusResponse?.success) {
            currentReceiver = statusResponse.currentReceiver
            if (statusResponse.pendingReceiver) {
              pendingChange = {
                address: statusResponse.pendingReceiver,
                executeTime: statusResponse.executeTime,
                canExecute: statusResponse.canExecute,
                timeRemaining: statusResponse.timeRemaining
              }
            }
          }
        } catch (error) {
          console.error('Error getting vault status:', error)
        }
      }

      setVaultData({
        vaultAddress: config?.platform_vault_address || '',
        currentReceiver,
        totalAllocations: allocations?.length || 0,
        totalTokensReceived: totalTokens,
        pendingReceiverChange: pendingChange
      })

    } catch (error) {
      console.error('Error loading vault data:', error)
      toast({
        title: "Error",
        description: "Failed to load vault data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const initiateReceiverChange = async () => {
    if (!newReceiver || !vaultData.vaultAddress) return

    try {
      setActionLoading(true)

      const { data, error } = await supabase.functions.invoke('update-vault-receiver', {
        body: { 
          newReceiver, 
          action: 'initiate',
          vaultAddress: vaultData.vaultAddress
        }
      })

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to initiate receiver change')
      }

      toast({
        title: "Receiver Change Initiated",
        description: "48-hour timelock is now active. Change can be executed after the timelock period.",
      })

      // Refresh data
      loadVaultData()

    } catch (error) {
      console.error('Error initiating receiver change:', error)
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const executeReceiverChange = async () => {
    if (!vaultData.pendingReceiverChange || !vaultData.vaultAddress) return

    try {
      setActionLoading(true)

      const { data, error } = await supabase.functions.invoke('update-vault-receiver', {
        body: { 
          newReceiver: vaultData.pendingReceiverChange.address, 
          action: 'execute',
          vaultAddress: vaultData.vaultAddress
        }
      })

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to execute receiver change')
      }

      toast({
        title: "Receiver Change Executed",
        description: `Vault receiver updated to ${vaultData.pendingReceiverChange.address}`,
      })

      // Refresh data
      loadVaultData()

    } catch (error) {
      console.error('Error executing receiver change:', error)
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ready to execute'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Platform Vault Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Vault Address</label>
              <p className="font-mono text-sm mt-1 break-all">
                {vaultData.vaultAddress || 'Not deployed'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Receiver</label>
              <p className="font-mono text-sm mt-1 break-all">
                {vaultData.currentReceiver}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{vaultData.totalAllocations}</div>
              <div className="text-sm text-muted-foreground">Graduated Agents</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {(vaultData.totalTokensReceived / 1_000_000).toFixed(1)}M
              </div>
              <div className="text-sm text-muted-foreground">
                Total Tokens Received
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                (4M per graduation × {vaultData.totalAllocations} agents)
              </div>
            </div>
          </div>

          {vaultData.pendingReceiverChange && (
            <div className="border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  Pending Receiver Change
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                New receiver: <code className="font-mono">{vaultData.pendingReceiverChange.address}</code>
              </p>
              <div className="flex items-center justify-between">
                <Badge variant={vaultData.pendingReceiverChange.canExecute ? "default" : "secondary"}>
                  {formatTimeRemaining(vaultData.pendingReceiverChange.timeRemaining)}
                </Badge>
                {vaultData.pendingReceiverChange.canExecute && (
                  <Button
                    onClick={executeReceiverChange}
                    disabled={actionLoading}
                    size="sm"
                    className="ml-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Execute Change
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Update Receiver Address
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Changes to the receiver address require a 48-hour timelock for security.
            </p>
            <div className="flex gap-2">
              <Input
                value={newReceiver}
                onChange={(e) => setNewReceiver(e.target.value)}
                placeholder="New receiver address (0x...)"
                className="font-mono"
              />
              <Button 
                onClick={initiateReceiverChange}
                disabled={actionLoading || !newReceiver || !vaultData.vaultAddress}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Initiate Change'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}