import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useENSWallet } from '@/hooks/useENSWallet'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Wallet, Globe, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WalletSettingsProps {
  className?: string
}

export const WalletSettings: React.FC<WalletSettingsProps> = ({ className }) => {
  const [ensName, setENSName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [resolvedWallet, setResolvedWallet] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  
  const { resolveAndUpdateWallet, validateENSName, validateWalletAddress, isLoading } = useENSWallet()
  const { user } = useAuth()

  // Load existing wallet information
  useEffect(() => {
    if (!user) return

    const loadWalletInfo = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address, ens_name, resolved_wallet, wallet_last_updated')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setWalletAddress(profile.wallet_address || '')
        setENSName(profile.ens_name || '')
        setResolvedWallet(profile.resolved_wallet || '')
        setLastUpdated(profile.wallet_last_updated)
      }
    }

    loadWalletInfo()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walletAddress && !ensName) {
      toast.error('Please provide either a wallet address or ENS name')
      return
    }

    if (walletAddress && !validateWalletAddress(walletAddress)) {
      toast.error('Invalid wallet address format')
      return
    }

    if (ensName && !validateENSName(ensName)) {
      toast.error('Invalid ENS name format (must end with .eth)')
      return
    }

    const result = await resolveAndUpdateWallet({
      ensName: ensName || undefined,
      walletAddress: walletAddress || undefined
    })

    if (result) {
      setResolvedWallet(result.resolvedWallet)
      setLastUpdated(new Date().toISOString())
    }
  }

  const handleClearWallet = async () => {
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        wallet_address: null,
        ens_name: null,
        resolved_wallet: null,
        wallet_last_updated: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (!error) {
      setWalletAddress('')
      setENSName('')
      setResolvedWallet('')
      setLastUpdated(new Date().toISOString())
      toast.success('Wallet information cleared')
    } else {
      toast.error('Failed to clear wallet information')
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet & ENS Settings
        </CardTitle>
        <CardDescription>
          Connect your wallet address and ENS name for revenue distribution and transparency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <Input
              id="wallet-address"
              placeholder="0x1234...abcd"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ens-name" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              ENS Name (Optional)
            </Label>
            <Input
              id="ens-name"
              placeholder="yourname.eth"
              value={ensName}
              onChange={(e) => setENSName(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Wallet Info'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClearWallet}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </form>

        {resolvedWallet && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Resolved Wallet</span>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-mono text-sm break-all">{resolvedWallet}</p>
                {ensName && resolvedWallet !== walletAddress && (
                  <Badge variant="secondary" className="mt-2">
                    Resolved from ENS
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Why connect your wallet?</p>
              <p className="text-blue-700 mt-1">
                Your wallet address is used for revenue distribution from agent trading fees. 
                ENS names provide a more human-readable way to display your identity.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}