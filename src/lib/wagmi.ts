import { http, createConfig } from 'wagmi'
import { mainnet, baseSepolia, optimism, base } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, baseSepolia, optimism, base],
  connectors: [],
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
  ssr: false,
})