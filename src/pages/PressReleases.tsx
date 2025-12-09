import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import disaIndustryDay2026 from "@/assets/press/disa-industry-day-2026.jpg";

interface PressRelease {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  link?: string;
  image?: string;
}

// Add your press releases here
const pressReleases: PressRelease[] = [
  {
    id: '1',
    title: 'Promptbox, a Micro-SaaS AI Agent Builder Platform, to Participate in DISA Industry Day 2026',
    date: '2025-11-20',
    excerpt: 'Promptbox announced today that it is participating in the Defense Information Systems Agency (DISA) Industry Day 2026 by submitting its capabilities in response to the Agency\'s request on artificial intelligence and emerging technologies.',
    category: 'Government',
    link: 'https://www.abnewswire.com/pressreleases/promptbox-a-microsaas-ai-agent-builder-platform-to-participate-in-disa-industry-day-2026_775439.html',
    image: disaIndustryDay2026
  },
];

const PressReleases = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-mono text-muted-foreground mb-3 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
            NEWSROOM
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-medium text-foreground mb-4 tracking-tight">
            Press Releases
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The latest news and announcements from Promptbox.
          </p>
        </div>

        {/* Press Releases Grid */}
        {pressReleases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pressReleases.map((release) => (
              <Card 
                key={release.id}
                className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/50 hover:border-border"
              >
                {release.image && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={release.image} 
                      alt={release.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      {release.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(release.date)}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
                    {release.title}
                  </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {release.excerpt}
                </p>
                
                  {release.link && (
                    <a 
                      href={release.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Read More
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Press Releases Yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for the latest news and announcements from Promptbox.
              </p>
            </div>
          </div>
        )}

        {/* Media Contact Section */}
        <div className="mt-24 text-center">
          <Card className="max-w-xl mx-auto p-8 bg-muted/30">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Media Inquiries
            </h3>
            <p className="text-muted-foreground mb-4">
              For press inquiries, please contact our media relations team.
            </p>
            <a 
              href="mailto:kevin@promptbox.com"
              className="text-foreground font-medium hover:text-primary transition-colors"
            >
              kevin@promptbox.com
            </a>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PressReleases;
