import { http, createConfig } from 'wagmi'
import { mainnet, baseSepolia, optimism, base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, baseSepolia, optimism, base],
  connectors: [
    injected(), // MetaMask and other injected wallets
  ],
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
  ssr: false,
})