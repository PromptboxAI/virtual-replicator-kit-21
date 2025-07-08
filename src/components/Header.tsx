import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Wallet } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent">
              VIRTUALS
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                AI Agents
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                ACP
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Build
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search agents..."
                className="pl-10 w-64 bg-muted/50 border-border"
              />
            </div>
            
            <Button variant="outline" className="hidden md:flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}