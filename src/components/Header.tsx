import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { WalletConnect } from "@/components/WalletConnect";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-foreground">
              PROMPTBOX
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
                AI Agents
              </Link>
              <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
                Build
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
                Ecosystem
              </a>
              <Link to="/learn" className="text-foreground hover:text-primary transition-colors font-medium">
                Learn
              </Link>
              <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">
                About
              </Link>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {!isAboutPage && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search agents..."
                  className="pl-10 w-64 bg-gray-50 border-gray-200"
                />
              </div>
            )}
            
            {!isAboutPage && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="hidden md:inline">Account</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem disabled>
                        <span className="text-muted-foreground">{user.email}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                )}
                <WalletConnect />
              </>
            )}
            
            {isAboutPage && (
              <Button className="bg-white border border-gray-300 text-foreground hover:bg-gray-50 font-medium">
                Whitepaper
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}