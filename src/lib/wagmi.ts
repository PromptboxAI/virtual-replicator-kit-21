import { http, createConfig } from 'wagmi'
import { base, mainnet, optimism } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, base, optimism],
  connectors: [
    injected(), // MetaMask and other injected wallets
    coinbaseWallet(),
    walletConnect({ projectId: 'your-project-id' }), // Replace with your WalletConnect project ID
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
})