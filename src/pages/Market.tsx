import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MarketOverview } from "@/components/MarketOverview";
import { LeaderboardsDisplay } from "@/components/LeaderboardsDisplay";

export default function Market() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <p className="text-sm font-mono text-muted-foreground mb-2 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
              TRADING
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-medium text-foreground tracking-tight">Agent Token Market</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trade AI agent tokens on Base. Each agent has its own token with unique bonding curve mechanics.
            </p>
          </div>
          
          <MarketOverview />
          
          <LeaderboardsDisplay />
        </div>
      </main>
      <Footer />
    </div>
  );
}