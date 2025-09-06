export interface ChainConfig {
  id: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  isActive: boolean;
  contracts: {
    weth: string;
    uniswapV3Factory: string;
    uniswapV3PositionManager: string;
    oneInchRouter?: string;
  };
  dexAggregators: {
    oneInch: {
      apiUrl: string;
      supported: boolean;
    };
  };
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // Base Sepolia (Testnet)
  84532: {
    id: 84532,
    name: 'base-sepolia',
    displayName: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
    isActive: true,
    contracts: {
      weth: '0x4200000000000000000000000000000000000006',
      uniswapV3Factory: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
      uniswapV3PositionManager: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
      oneInchRouter: '0x0000000000000000000000000000000000000000',
    },
    dexAggregators: {
      oneInch: {
        apiUrl: 'https://api.1inch.dev/swap/v6.0/84532',
        supported: true,
      },
    },
  },
  
  // Base Mainnet
  8453: {
    id: 8453,
    name: 'base',
    displayName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
    isActive: false, // Will be activated when ready for production
    contracts: {
      weth: '0x4200000000000000000000000000000000000006',
      uniswapV3Factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
      uniswapV3PositionManager: '0x03a520b32C04BF3bEEf7BF5d54C21B80F915D46e',
      oneInchRouter: '0x111111125421cA6dc452d289314280a0f8842A65',
    },
    dexAggregators: {
      oneInch: {
        apiUrl: 'https://api.1inch.dev/swap/v6.0/8453',
        supported: true,
      },
    },
  },
  
  // Ethereum Sepolia (Future support)
  11155111: {
    id: 11155111,
    name: 'sepolia',
    displayName: 'Ethereum Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
    isActive: false,
    contracts: {
      weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      uniswapV3Factory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
      uniswapV3PositionManager: '0x1238536071E1c677A632429e3655c799b22cDA52',
    },
    dexAggregators: {
      oneInch: {
        apiUrl: 'https://api.1inch.dev/swap/v6.0/11155111',
        supported: false,
      },
    },
  },
};

export const DEFAULT_CHAIN = SUPPORTED_CHAINS[84532]; // Base Sepolia

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

export function getActiveChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.isActive);
}

export function getTestnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.isTestnet);
}

export function getMainnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => !chain.isTestnet);
}

export function isChainSupported(chainId: number): boolean {
  const chain = getChainConfig(chainId);
  return chain !== undefined && chain.isActive;
}

export function getChainRpcUrl(chainId: number): string {
  const chain = getChainConfig(chainId);
  return chain?.rpcUrl || DEFAULT_CHAIN.rpcUrl;
}

export function getChainBlockExplorer(chainId: number): string {
  const chain = getChainConfig(chainId);
  return chain?.blockExplorer || DEFAULT_CHAIN.blockExplorer;
}

export function formatChainName(chainId: number): string {
  const chain = getChainConfig(chainId);
  return chain?.displayName || `Chain ${chainId}`;
}