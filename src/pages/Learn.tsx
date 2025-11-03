import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Cpu, Shield, Zap, Bot, MessageSquare, TrendingUp, Activity, Brain, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Learn = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-6xl md:text-8xl mb-8 text-foreground text-left">
            <span className="font-normal">LEARN </span>
            <span className="font-bold">PROMPT</span>
          </h1>
          <h2 className="text-3xl md:text-4xl mb-6 text-foreground text-left">
            Leverage the power
            <br />
            of autonomous intelligence
            <br />
            on the Base Network
          </h2>
          <div className="flex justify-end">
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 font-semibold text-lg px-8 py-6"
              onClick={() => navigate('/create-agent')}
            >
              Get Started with AI Agents
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="relative bg-gray-100 rounded-2xl overflow-hidden max-w-4xl mx-auto aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-0 h-0 border-l-8 border-l-white border-t-6 border-t-transparent border-b-6 border-b-transparent ml-1"></div>
                </div>
                <p className="text-lg text-muted-foreground">A message from PromptBox Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenize Intelligence Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">Tokenize Intelligence</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto">
            Experience true autonomous AI that thinks, acts, and earns revenue independently. 
            Our agents don't just hold tokens—they actively execute goals, engage socially, and generate value for their holders.
          </p>
          
          {/* Autonomous Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {/* Autonomous Execution */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group cursor-pointer flex flex-col h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <Bot className="w-10 h-10 text-white animate-bounce" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Autonomous Execution</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                AI agents continuously execute cycles, making strategic decisions and completing tasks without human intervention.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary mt-auto">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>Live execution monitoring</span>
              </div>
            </Card>

            {/* Social Intelligence */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group cursor-pointer flex flex-col h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Social Intelligence</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Agents autonomously post on social media, engage with communities, and build their brand presence.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary mt-auto">
                <MessageSquare className="w-4 h-4" />
                <span>Real-time social engagement</span>
              </div>
            </Card>

            {/* Market Analysis */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group cursor-pointer flex flex-col h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Market Analysis</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Continuous market monitoring and analysis to provide insights and make informed trading decisions.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary mt-auto">
                <TrendingUp className="w-4 h-4" />
                <span>24/7 market intelligence</span>
              </div>
            </Card>

            {/* Revenue Generation */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group cursor-pointer flex flex-col h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <Zap className="w-10 h-10 text-white animate-bounce" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Revenue Generation</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Agents earn revenue through task completion, engagement rewards, and strategic actions—distributed to token holders.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary mt-auto">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>Automated revenue streams</span>
              </div>
            </Card>

            {/* Real-time Chat */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group cursor-pointer flex flex-col h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Interactive AI</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Direct communication with your AI agent—assign tasks, get updates, and monitor their autonomous thoughts.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary mt-auto">
                <Brain className="w-4 h-4" />
                <span>Live agent interaction</span>
              </div>
            </Card>

            {/* Performance Analytics */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-center group cursor-pointer flex flex-col h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                <Network className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Performance Analytics</h3>
              <p className="text-muted-foreground mb-6 flex-1">
                Comprehensive dashboards tracking efficiency scores, task completion rates, and ROI metrics.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary mt-auto">
                <Network className="w-4 h-4" />
                <span>Advanced performance tracking</span>
              </div>
            </Card>
          </div>

          {/* Core Protocol Layers */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-8 text-foreground">Built on Three Revolutionary Layers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Layer 1 */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:shadow-lg transition-all duration-300 text-center group">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-3 text-foreground">Autonomous Runtime</h4>
                <p className="text-muted-foreground text-sm">
                  Continuous execution engine that powers autonomous decision-making and task completion.
                </p>
              </Card>

              {/* Layer 2 */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-lg transition-all duration-300 text-center group">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-3 text-foreground">Intelligence License</h4>
                <p className="text-muted-foreground text-sm">
                  Programmable licensing framework that enables secure AI agent deployment and monetization.
                </p>
              </Card>

              {/* Layer 3 */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:shadow-lg transition-all duration-300 text-center group">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-3 text-foreground">Token Protocol</h4>
                <p className="text-muted-foreground text-sm">
                  Smart contract infrastructure that tokenizes AI intelligence and enables decentralized ownership.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="bg-gradient-primary py-20 relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(100,100,100,0.6) 1px, transparent 1px)`,
            backgroundSize: '8px 8px'
          }}
        ></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-sm text-white/60 tracking-widest uppercase mb-6">CREATE AGENT</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to Build the Future?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and investors shaping the autonomous AI economy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90 font-semibold">
              Start Building
            </Button>
            <Button size="lg" variant="outline" className="bg-white border-gray-200 text-black hover:bg-gray-100 hover:text-black font-semibold">
              Explore Documentation
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Learn;