import { http, createConfig } from 'wagmi'
import { mainnet, baseSepolia, optimism } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, baseSepolia, optimism],
  connectors: [
    injected(), // MetaMask and other injected wallets only
  ],
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http(),
    [optimism.id]: http(),
  },
})