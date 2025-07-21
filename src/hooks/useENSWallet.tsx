import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

interface ENSWalletData {
  ensName?: string
  walletAddress?: string
  resolvedWallet?: string
  ensResolved?: boolean
}

export const useENSWallet = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const resolveAndUpdateWallet = async (data: ENSWalletData) => {
    if (!user) {
      toast.error('Please sign in to update wallet information')
      return null
    }

    setIsLoading(true)
    try {
      const { data: result, error } = await supabase.functions.invoke('resolve-ens', {
        body: {
          ensName: data.ensName,
          walletAddress: data.walletAddress,
          userId: user.id
        }
      })

      if (error) {
        console.error('ENS resolution error:', error)
        toast.error('Failed to resolve ENS or update wallet')
        return null
      }

      if (result.ensResolved) {
        toast.success(`ENS ${data.ensName} resolved to ${result.resolvedWallet}`)
      } else {
        toast.success('Wallet information updated successfully')
      }

      return result
    } catch (error) {
      console.error('Error calling resolve-ens function:', error)
      toast.error('Failed to update wallet information')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const validateENSName = (ensName: string): boolean => {
    return ensName.endsWith('.eth') && ensName.length > 4
  }

  const validateWalletAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  return {
    resolveAndUpdateWallet,
    validateENSName,
    validateWalletAddress,
    isLoading
  }
}