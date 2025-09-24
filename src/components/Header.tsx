import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, LogOut, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

import TestnetOnlyBanner from "./TestnetOnlyBanner";
import { SystemStatusIndicator } from "./SystemStatusIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const { user, signOut, signIn, linkWallet, unlinkWallet } = useAuth();
  const { isAdmin } = useUserRole();

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
                  src="/lovable-uploads/2e7ad5f9-215d-4361-bcc3-b84d6328849c.png" 
                  alt="PROMPTBOX" 
                  className="h-12 w-auto"
                />
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link to="/ai-agents" className="text-foreground hover:text-primary transition-colors font-medium">
                  AI Agents
                </Link>
                <Link to="/create" className="text-foreground hover:text-primary transition-colors font-medium">
                  Create Agent
                </Link>
                <Link to="/learn" className="text-foreground hover:text-primary transition-colors font-medium">
                  Learn
                </Link>
                <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">
                  About
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-red-500 hover:text-red-600 transition-colors font-medium">
                    ADMIN
                  </Link>
                )}
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <SystemStatusIndicator />
              
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
                  <Button asChild variant="dashboard">
                    <Link to="/my-agents">Dashboard</Link>
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
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/admin" className="flex items-center">
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                <Button onClick={signIn} variant="outline">
                  Sign In
                </Button>
              )}
              
              {isAboutPage && (
                <Button className="bg-white border border-gray-300 text-foreground hover:bg-gray-50 font-medium">
                  Whitepaper
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}