import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  title: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: string;
  responseExample: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/healthz',
    title: 'Health Check',
    description: 'Check API status and system mode.',
    responseExample: `{
  "status": "ok",
  "mode": "mainnet",
  "apiVersion": "v1",
  "timestamp": "2024-01-15T12:00:00Z",
  "features": {
    "trading": true,
    "graduation": true
  }
}`
  },
  {
    method: 'GET',
    path: '/list-tokens',
    title: 'List Tokens',
    description: 'Get paginated list of all agent tokens.',
    parameters: [
      { name: 'limit', type: 'integer', required: false, description: 'Number of results (default: 50, max: 100)' },
      { name: 'offset', type: 'integer', required: false, description: 'Pagination offset (default: 0)' },
      { name: 'sortBy', type: 'string', required: false, description: 'Sort field: volume, marketCap, created (default: created)' },
      { name: 'order', type: 'string', required: false, description: 'Sort order: asc, desc (default: desc)' },
      { name: 'graduated', type: 'boolean', required: false, description: 'Filter by graduation status' }
    ],
    responseExample: `{
  "tokens": [
    {
      "id": "agent-uuid",
      "name": "Trading Bot Alpha",
      "symbol": "TBA",
      "tokenAddress": "0x...",
      "currentPrice": 0.000152,
      "marketCap": 45632.12,
      "volume24h": 12450.50,
      "priceChange24h": 15.42,
      "holders": 234,
      "graduated": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 156,
  "limit": 50,
  "offset": 0
}`
  },
  {
    method: 'GET',
    path: '/get-token-metadata/:agentId',
    title: 'Get Token Metadata',
    description: 'Get detailed information about a specific token.',
    parameters: [
      { name: 'agentId', type: 'string', required: true, description: 'Agent UUID or token address' }
    ],
    responseExample: `{
  "id": "agent-uuid",
  "name": "Trading Bot Alpha",
  "symbol": "TBA",
  "description": "Automated trading bot",
  "tokenAddress": "0x...",
  "pricing": {
    "currentPrice": 0.000152,
    "marketCap": 45632.12,
    "fdv": 152000.00
  },
  "metrics": {
    "volume24h": 12450.50,
    "priceChange24h": 15.42,
    "holders": 234
  }
}`
  },
  {
    method: 'GET',
    path: '/get-ohlc/:agentId',
    title: 'Get OHLC Data',
    description: 'Get historical price data in OHLC (Open, High, Low, Close) format.',
    parameters: [
      { name: 'timeframe', type: 'string', required: true, description: 'Candle timeframe: 1m, 5m, 15m, 1h, 4h, 1d' },
      { name: 'from', type: 'ISO string', required: true, description: 'Start date' },
      { name: 'to', type: 'ISO string', required: true, description: 'End date' },
      { name: 'limit', type: 'integer', required: false, description: 'Max candles (default: 1000, max: 5000)' }
    ],
    responseExample: `{
  "agentId": "agent-uuid",
  "timeframe": "1h",
  "candles": [
    {
      "timestamp": "2024-01-15T12:00:00Z",
      "open": 0.000150,
      "high": 0.000158,
      "low": 0.000148,
      "close": 0.000152,
      "volume": 1250000
    }
  ],
  "count": 24
}`
  },
  {
    method: 'GET',
    path: '/get-liquidity/:agentId',
    title: 'Get Liquidity Data',
    description: 'Get liquidity metrics for an agent token.',
    responseExample: `{
  "agentId": "agent-uuid",
  "totalLiquidity": 125000.50,
  "reserves": {
    "token": 85000000,
    "prompt": 12500.00
  },
  "priceImpact": {
    "buy1000": 0.5,
    "buy10000": 2.3,
    "sell1000": 0.4,
    "sell10000": 2.1
  }
}`
  },
  {
    method: 'POST',
    path: '/build-trade-tx',
    title: 'Build Trade Transaction',
    description: 'Construct transaction parameters for a trade.',
    requestBody: `{
  "agentId": "agent-uuid",
  "tradeType": "buy",
  "promptAmount": 100.0,
  "slippageTolerance": 0.5,
  "userAddress": "0x..."
}`,
    responseExample: `{
  "transaction": {
    "to": "0x...",
    "data": "0x...",
    "value": "0",
    "gasLimit": "150000"
  },
  "trade": {
    "type": "buy",
    "promptAmount": 100.0,
    "tokenAmount": 656250.0,
    "pricePerToken": 0.000152,
    "priceImpact": 0.35
  },
  "expiry": "2024-01-15T12:05:00Z"
}`
  },
  {
    method: 'GET',
    path: '/get-market-overview',
    title: 'Get Market Overview',
    description: 'Get aggregated market statistics.',
    responseExample: `{
  "totalAgents": 156,
  "totalVolume24h": 1250000.50,
  "totalMarketCap": 45000000.00,
  "totalHolders": 12450,
  "graduated": 23,
  "trending": [
    {
      "agentId": "agent-uuid",
      "name": "Trading Bot Alpha",
      "priceChange24h": 45.2
    }
  ]
}`
  },
  {
    method: 'GET',
    path: '/get-leaderboards',
    title: 'Get Leaderboards',
    description: 'Get top performing agents by various metrics.',
    parameters: [
      { name: 'metric', type: 'string', required: false, description: 'volume, marketCap, holders, gainers, losers (default: volume)' },
      { name: 'limit', type: 'integer', required: false, description: 'Results to return (default: 10, max: 50)' }
    ],
    responseExample: `{
  "metric": "volume",
  "leaderboard": [
    {
      "rank": 1,
      "agentId": "agent-uuid",
      "name": "Trading Bot Alpha",
      "symbol": "TBA",
      "value": 125000.50,
      "change24h": 15.42
    }
  ],
  "lastUpdated": "2024-01-15T12:00:00Z"
}`
  }
];

const CodeBlock = ({ code, language = 'json' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-foreground">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-foreground/70" />}
      </button>
    </div>
  );
};

const EndpointCard = ({ endpoint }: { endpoint: Endpoint }) => {
  const [isOpen, setIsOpen] = useState(false);

  const methodColors = {
    GET: 'bg-green-100 text-green-700 border-green-200',
    POST: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
      >
        <span className={`px-3 py-1 text-xs font-mono font-semibold rounded border ${methodColors[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <span className="font-mono text-sm text-foreground/70">{endpoint.path}</span>
        <span className="font-medium text-foreground ml-auto mr-4">{endpoint.title}</span>
        {isOpen ? <ChevronDown className="w-5 h-5 text-foreground/50" /> : <ChevronRight className="w-5 h-5 text-foreground/50" />}
      </button>

      {isOpen && (
        <div className="px-6 py-6 border-t border-border space-y-6">
          <p className="text-foreground/80">{endpoint.description}</p>

          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Parameters</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Type</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Required</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {endpoint.parameters.map((param) => (
                      <tr key={param.name}>
                        <td className="px-4 py-2 font-mono text-foreground">{param.name}</td>
                        <td className="px-4 py-2 text-foreground/70">{param.type}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${param.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {param.required ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-foreground/70">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {endpoint.requestBody && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Request Body</h4>
              <CodeBlock code={endpoint.requestBody} />
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Response</h4>
            <CodeBlock code={endpoint.responseExample} />
          </div>
        </div>
      )}
    </div>
  );
};

const ApiReference = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            API Reference
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Access token data, trading information, and market metrics through our REST API
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Base URL</h3>
            <code className="text-xs text-foreground/70 bg-muted/50 px-2 py-1 rounded break-all">
              https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1
            </code>
          </div>
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Authentication</h3>
            <p className="text-sm text-foreground/70">Public endpoints, no auth required</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Rate Limits</h3>
            <p className="text-sm text-foreground/70">100 req/min, 1000 req/hour per IP</p>
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <EndpointCard key={endpoint.path} endpoint={endpoint} />
            ))}
          </div>
        </div>

        {/* Error Codes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Error Codes</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Code</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-6 py-3 font-mono text-foreground">TOKEN_NOT_FOUND</td>
                  <td className="px-6 py-3 text-foreground/70">Agent token doesn't exist</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono text-foreground">INVALID_PARAMETERS</td>
                  <td className="px-6 py-3 text-foreground/70">Invalid query parameters</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono text-foreground">RATE_LIMIT_EXCEEDED</td>
                  <td className="px-6 py-3 text-foreground/70">Too many requests</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono text-foreground">INSUFFICIENT_LIQUIDITY</td>
                  <td className="px-6 py-3 text-foreground/70">Not enough liquidity for trade</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SDK Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Start</h2>
          <CodeBlock
            code={`const BASE_URL = 'https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1';

// Fetch token list
const response = await fetch(\`\${BASE_URL}/list-tokens?limit=10\`);
const data = await response.json();

// Get specific token metadata
const tokenResponse = await fetch(\`\${BASE_URL}/get-token-metadata?id=\${agentId}\`);
const token = await tokenResponse.json();`}
            language="typescript"
          />
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-foreground/70 mb-4">
            Need help with the API? Contact our developer support team.
          </p>
          <a
            href="mailto:kevin@promptbox.com"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApiReference;