import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createOkxSwapWidget } from '@okxweb3/dex-widget';

interface OKXDEXWidgetProps {
  tokenAddress: string;
  agentSymbol: string;
  onConnect?: () => void;
  isConnected: boolean;
}

export function OKXDEXWidget({ tokenAddress, agentSymbol, onConnect, isConnected }: OKXDEXWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadOKXWidget = async () => {
      try {
        if (widgetRef.current) {
          // Clear any existing widget
          widgetRef.current.innerHTML = '';
          
          // Initialize the OKX DEX Widget
          const widget = createOkxSwapWidget(widgetRef.current, {
            // Theme configuration
            theme: 'dark',
            
            // Default tokens
            fromChainId: 8453, // Base chain ID
            toChainId: 8453,
            fromTokenAddress: '0x0000000000000000000000000000000000000000', // ETH
            toTokenAddress: tokenAddress,
            
            // Amount
            fromAmount: '',
            
            // Event handlers
            onConnectWallet: () => {
              if (!isConnected) {
                onConnect?.();
              }
            },
            
            onSwapSuccess: (txHash: string) => {
              console.log('Swap successful:', txHash);
            },
            
            onSwapError: (error: any) => {
              console.error('Swap failed:', error);
            }
          } as any);
        }
      } catch (error) {
        console.error('Failed to load OKX DEX Widget:', error);
        
        // Fallback: Show iframe version if the widget fails
        if (widgetRef.current) {
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.okx.com/web3/dex-swap/widget?fromChain=8453&toChain=8453&fromToken=0x0000000000000000000000000000000000000000&toToken=${tokenAddress}&theme=dark`;
          iframe.width = '100%';
          iframe.height = '500px';
          iframe.style.border = 'none';
          iframe.style.borderRadius = '0.5rem';
          
          widgetRef.current.appendChild(iframe);
        }
      }
    };

    loadOKXWidget();
  }, [tokenAddress, agentSymbol, isConnected, onConnect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={widgetRef} className="w-full min-h-[500px]" />
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Powered by OKX DEX
        </div>
      </CardContent>
    </Card>
  );
}