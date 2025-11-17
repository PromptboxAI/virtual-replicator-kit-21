import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import App from './App.tsx'
import './index.css'

// Inject buffer polyfill globally for Web3 libraries
globalThis.Buffer = Buffer

// Suppress WalletConnect duplicate initialization warning in development
// This is a known issue when Privy has wallet_auth enabled at dashboard level
// but the app only uses email login. Safe to suppress as it doesn't affect functionality.
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' && 
    args[0].includes('WalletConnect Core is already initialized')
  ) {
    return; // Suppress this specific warning
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
