import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MarketOverview } from "@/components/MarketOverview";

export default function Market() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Agent Token Market</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trade AI agent tokens on Base. Each agent has its own token with unique bonding curve mechanics.
            </p>
          </div>
          
          <MarketOverview />
        </div>
      </main>
      <Footer />
    </div>
  );
}