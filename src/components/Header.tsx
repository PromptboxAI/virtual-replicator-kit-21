import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, LogOut, Wallet, ChevronDown, Menu, X, Bot, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { getAddressExplorerUrl } from "@/lib/networkConfig";
import TestnetOnlyBanner from "./TestnetOnlyBanner";
import { SystemStatusIndicator } from "./SystemStatusIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const { user, signOut, signIn, linkWallet, unlinkWallet } = useAuth();
  const { isAdmin } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <TestnetOnlyBanner />
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <img 
                  src="/lovable-uploads/promptbox-logo-new.png" 
                  alt="PROMPTBOX" 
                  className="h-10 md:h-12 w-auto"
                />
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link to="/ai-agents" className="text-foreground hover:text-primary transition-colors font-medium">
                  AI Agents
                </Link>
                <a href="https://trade.promptbox.com" className="text-foreground hover:text-primary transition-colors font-medium" target="_blank" rel="noopener noreferrer">
                  Trade
                </a>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center text-foreground hover:text-primary transition-colors font-medium focus:outline-none">
                    Create Agent
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-background">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/create" className="flex items-center w-full">
                        Create Agent
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/faucet" className="flex items-center w-full">
                        Faucet
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link to="/learn" className="text-foreground hover:text-primary transition-colors font-medium">
                  Learn
                </Link>
              </nav>
            </div>

            {/* Actions - Desktop and Mobile */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden md:block">
                <SystemStatusIndicator />
              </div>
              
              {!isAboutPage && (
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search agents..."
                    className="pl-10 w-64 bg-gray-50 border-gray-200"
                  />
                </div>
              )}
              
              {/* Auth Section - Always visible */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="dashboard" className="hidden md:flex">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuItem disabled>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium">
                            {user.email?.address || 'Signed In'}
                          </span>
                          {user.wallet?.address && user.wallet?.walletClientType !== 'privy' ? (
                            <span className="text-xs text-muted-foreground font-mono">
                              {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                            </span>
                          ) : (
                            <span className="text-xs text-orange-600">
                              External wallet required
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer md:hidden">
                        <Link to="/dashboard" className="flex items-center">
                          {isAdmin ? 'Agent Dashboard' : 'Dashboard'}
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild className="cursor-pointer md:hidden">
                          <Link to="/admin" className="flex items-center">
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="md:hidden" />
                      {!user.wallet || user.wallet.walletClientType === 'privy' ? (
                        <DropdownMenuItem onClick={linkWallet} className="cursor-pointer">
                          <Wallet className="mr-2 h-4 w-4" />
                          Connect External Wallet
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => user.wallet && unlinkWallet(user.wallet.address)} className="cursor-pointer text-orange-600">
                          <Wallet className="mr-2 h-4 w-4" />
                          Disconnect External Wallet
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      
                      {/* Portfolio Link */}
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/dashboard" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Portfolio
                        </Link>
                      </DropdownMenuItem>

                      {/* My Agents Link */}
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/dashboard" className="flex items-center">
                          <Bot className="mr-2 h-4 w-4" />
                          My Agents
                        </Link>
                      </DropdownMenuItem>

                      {/* View on Explorer - Only if external wallet connected */}
                      {user.wallet && user.wallet.walletClientType !== 'privy' && (
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <a 
                            href={getAddressExplorerUrl(user.wallet.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View on Explorer
                          </a>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild className="cursor-pointer hidden md:flex">
                            <Link to="/admin" className="flex items-center">
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer hidden md:flex">
                            <Link to="/ai-agents" className="flex items-center">
                              Internal Agents List
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer hidden md:flex">
                            <Link to="/test-sepolia-token" className="flex items-center">
                              Test Sepolia Token
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="hidden md:block" />
                        </>
                      )}
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button onClick={signIn} variant="outline" className="hidden md:flex">
                  Sign In
                </Button>
              )}
              
              {isAboutPage && (
                <Button className="hidden md:flex bg-white border border-gray-300 text-foreground hover:bg-gray-50 font-medium">
                  Whitepaper
                </Button>
              )}
              
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full h-full max-w-full p-0">
                  <div className="flex flex-col h-full bg-background">
                    {/* Header with logo */}
                    <div className="flex items-center justify-start p-4 border-b">
                      <img 
                        src="/lovable-uploads/promptbox-logo-new.png" 
                        alt="PROMPTBOX" 
                        className="h-10 w-auto"
                      />
                    </div>
                    
                    {/* Navigation Links */}
                    <nav className="flex flex-col flex-1 p-6 space-y-6 overflow-y-auto">
                    <Link 
                      to="/ai-agents" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      AI Agents
                    </Link>
                    <a 
                      href="https://trade.promptbox.com" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Trade
                    </a>
                    
                    <div className="flex flex-col space-y-3">
                      <p className="text-sm font-semibold text-muted-foreground">Create Agent</p>
                      <Link 
                        to="/create" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors pl-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Create Agent
                      </Link>
                      <Link 
                        to="/faucet" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors pl-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Faucet
                      </Link>
                    </div>
                    
                    <Link 
                      to="/learn" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Learn
                    </Link>
                    
                    {user ? (
                      <>
                        <Link 
                          to="/dashboard" 
                          className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        
                        <button
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="text-lg font-medium text-destructive hover:text-destructive/90 transition-colors text-left"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          signIn();
                          setMobileMenuOpen(false);
                        }}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left"
                      >
                        Sign In
                      </button>
                    )}
                    </nav>
                    
                    {/* Bottom Action Buttons */}
                    {isAboutPage && (
                      <div className="p-6 border-t">
                        <Button className="w-full bg-white border border-gray-300 text-foreground hover:bg-gray-50 font-medium">
                          Whitepaper
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}