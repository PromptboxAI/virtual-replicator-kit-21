// Central definition of all app routes for SEO management
export interface AppRoute {
  path: string;
  name: string;
  isDynamic: boolean;
  isIndexable: boolean;
}

// All routes in the application - update this when adding new pages
export const APP_ROUTES: AppRoute[] = [
  { path: '/', name: 'Homepage', isDynamic: false, isIndexable: true },
  { path: '/ai-agents', name: 'AI Agents', isDynamic: false, isIndexable: true },
  { path: '/auth', name: 'Authentication', isDynamic: false, isIndexable: false },
  { path: '/about', name: 'About', isDynamic: false, isIndexable: true },
  { path: '/learn', name: 'Learn', isDynamic: false, isIndexable: true },
  { path: '/faucet', name: 'Faucet', isDynamic: false, isIndexable: true },
  { path: '/create', name: 'Create Agent', isDynamic: false, isIndexable: true },
  { path: '/dashboard', name: 'Dashboard', isDynamic: false, isIndexable: false },
  { path: '/dashboard/:agentId', name: 'Agent Dashboard', isDynamic: true, isIndexable: false },
  { path: '/market', name: 'Market', isDynamic: false, isIndexable: true },
  { path: '/agents', name: 'All Agents', isDynamic: false, isIndexable: true },
  { path: '/agent/:agentId', name: 'Agent Detail', isDynamic: true, isIndexable: true },
  { path: '/admin', name: 'Admin', isDynamic: false, isIndexable: false },
  { path: '/admin-settings', name: 'Admin Settings', isDynamic: false, isIndexable: false },
  { path: '/admin/seo', name: 'SEO Manager', isDynamic: false, isIndexable: false },
  { path: '/contract-test', name: 'Contract Test', isDynamic: false, isIndexable: false },
  { path: '/test-lab', name: 'Test Lab', isDynamic: false, isIndexable: false },
  { path: '/test-sepolia-token', name: 'Test Token', isDynamic: false, isIndexable: false },
  { path: '/graduation-test', name: 'Graduation Test', isDynamic: false, isIndexable: false },
  { path: '/price-audit', name: 'Price Audit', isDynamic: false, isIndexable: false },
  { path: '/token-agents', name: 'Token Agents', isDynamic: false, isIndexable: true },
  { path: '/fee-test/:agentId', name: 'Fee Test', isDynamic: true, isIndexable: false },
  { path: '/healthz', name: 'Health Check', isDynamic: false, isIndexable: false },
  { path: '/privacy', name: 'Privacy Policy', isDynamic: false, isIndexable: true },
  { path: '/terms', name: 'Terms of Service', isDynamic: false, isIndexable: true },
  { path: '/promptbox-dpa', name: 'Promptbox DPA', isDynamic: false, isIndexable: true },
  { path: '/careers', name: 'Careers', isDynamic: false, isIndexable: true },
  { path: '/status', name: 'Status', isDynamic: false, isIndexable: true },
  { path: '/api-reference', name: 'API Reference', isDynamic: false, isIndexable: true },
  { path: '/press-releases', name: 'Press Releases', isDynamic: false, isIndexable: true },
  { path: '/platform/ai-agents', name: 'AI Agents Hub', isDynamic: false, isIndexable: true },
  { path: '/platform/ai-agents/:agentId', name: 'AI Agent Detail', isDynamic: true, isIndexable: true },
  { path: '/contact', name: 'Contact', isDynamic: false, isIndexable: true },
];

export function getMissingRoutes(existingPaths: string[]): AppRoute[] {
  return APP_ROUTES.filter(route => !existingPaths.includes(route.path));
}
