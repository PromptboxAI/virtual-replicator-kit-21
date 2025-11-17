import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import App from './App.tsx'
import './index.css'

// Inject buffer polyfill globally for Web3 libraries
globalThis.Buffer = Buffer

createRoot(document.getElementById("root")!).render(<App />);
