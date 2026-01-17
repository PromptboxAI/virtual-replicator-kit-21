import { Linkedin, Twitter, Github, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSystemStatus, getStatusColor, getStatusText } from '@/hooks/useSystemStatus';

const Footer = () => {
  const systemStatus = useSystemStatus();
  return (
    <footer className="mt-auto py-12 px-4 border-t border-border bg-white dark:bg-background">
      <div className="container mx-auto">
        {/* Top section with email and links */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-12">
          {/* Left column - Email subscription and badges */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-6">
              <Input 
                type="email" 
                placeholder="Your email address"
                className="flex-1"
              />
              <Button className="bg-black text-white hover:bg-black/90">Subscribe</Button>
            </div>
            
            <div className="flex items-center gap-3">
              <img 
                src="/badges/gdpr-badge.webp" 
                alt="GDPR Compliant" 
                className="h-12 w-auto"
              />
              <img 
                src="/badges/hipaa-badge.webp" 
                alt="HIPAA Compliant" 
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">Platform</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/platform/ai-agents" className="block hover:text-foreground transition-colors">AI Agents</Link>
              <div className="hover:text-foreground cursor-pointer transition-colors">ACP Protocol</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">PROMPT Framework</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Governance</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Workflow Builder</div>
            </div>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">Support</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="https://promptbox.gitbook.io/promptbox/" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">Documentation</a>
              <Link to="/api-reference" className="block hover:text-foreground transition-colors">API Reference</Link>
              <Link to="/status" className="block hover:text-foreground transition-colors">Status Page</Link>
              <Link to="/contact" className="block hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">Company</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="hover:text-foreground cursor-pointer transition-colors">Blog</div>
              <Link to="/careers" className="block hover:text-foreground transition-colors">Careers</Link>
              <div className="hover:text-foreground cursor-pointer transition-colors">About Us</div>
              <Link to="/press-releases" className="block hover:text-foreground transition-colors">Press Releases</Link>
              <a href="mailto:kevin@promptbox.com" className="block hover:text-foreground transition-colors">Get a Demo</a>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">Legal</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/privacy" className="block hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="block hover:text-foreground transition-colors">Terms</Link>
              <Link to="/promptbox-dpa" className="block hover:text-foreground transition-colors">Promptbox DPA</Link>
              <a href="/documents/OpenAI-DPA.pdf" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">OpenAI DPA</a>
              <a href="/documents/Anthropic-DPA.pdf" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">Anthropic DPA</a>
              <a href="mailto:kevin@promptbox.com" className="block hover:text-foreground transition-colors">Sign BAA With Us</a>
            </div>
          </div>
        </div>

        {/* Bottom section with logo, copyright, and social */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-border">
          <div className="flex items-center gap-8">
            <img 
              src="/lovable-uploads/promptbox-logo-new.png" 
              alt="PROMPTBOX" 
              className="h-8 w-auto"
            />
            <p className="text-sm text-muted-foreground">
              ©2025 PROMPTBOX. All rights reserved
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/status" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.overall)}`}></div>
              {getStatusText(systemStatus.overall)}
            </Link>
            <div className="flex items-center gap-3">
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              <Github className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              <Youtube className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };