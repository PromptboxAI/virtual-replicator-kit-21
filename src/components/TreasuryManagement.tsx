import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Edit, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TreasuryConfig {
  id: string;
  network: string;
  treasury_address: string;
  is_active: boolean;
  updated_at: string;
}

export function TreasuryManagement() {
  const [treasuryConfigs, setTreasuryConfigs] = useState<TreasuryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    fetchTreasuryConfigs();
  }, []);

  const fetchTreasuryConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('treasury_config')
        .select('*')
        .order('network');

      if (error) throw error;
      setTreasuryConfigs(data || []);
    } catch (error) {
      console.error('Error fetching treasury configs:', error);
      toast.error('Failed to load treasury configurations');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (config: TreasuryConfig) => {
    setEditingId(config.id);
    setEditAddress(config.treasury_address);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAddress('');
  };

  const saveEdit = async (id: string) => {
    if (!editAddress || !editAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    try {
      const { error } = await supabase
        .from('treasury_config')
        .update({ treasury_address: editAddress })
        .eq('id', id);

      if (error) throw error;

      await fetchTreasuryConfigs();
      setEditingId(null);
      setEditAddress('');
      toast.success('Treasury address updated successfully');
    } catch (error) {
      console.error('Error updating treasury address:', error);
      toast.error('Failed to update treasury address');
    }
  };

  const validateAddress = (address: string) => {
    return address && address.match(/^0x[a-fA-F0-9]{40}$/);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Treasury Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Treasury Management
        </CardTitle>
        <CardDescription>
          Configure treasury addresses for different networks. These addresses receive platform fees and agent creation payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Treasury addresses receive all platform revenue. Consider using multi-sig wallets for production networks.
          </AlertDescription>
        </Alert>

        {treasuryConfigs.map((config) => (
          <div key={config.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={config.network === 'mainnet' ? 'default' : 'secondary'}>
                  {config.network.toUpperCase()}
                </Badge>
                {config.is_active && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Updated: {new Date(config.updated_at).toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Treasury Address</Label>
              {editingId === config.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="0x..."
                    className={`font-mono text-sm ${
                      editAddress && !validateAddress(editAddress) 
                        ? 'border-red-300 focus:border-red-500' 
                        : ''
                    }`}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => saveEdit(config.id)}
                    disabled={!validateAddress(editAddress)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded border">
                  <code className="text-sm font-mono">
                    {config.treasury_address}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(config)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {editingId === config.id && editAddress && !validateAddress(editAddress) && (
                <p className="text-sm text-red-600">Please enter a valid Ethereum address (0x...)</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}