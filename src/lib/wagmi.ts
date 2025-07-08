import { http, createConfig } from 'wagmi'
import { mainnet, base, optimism } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, base, optimism],
  connectors: [
    injected(), // MetaMask and other injected wallets only
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
})