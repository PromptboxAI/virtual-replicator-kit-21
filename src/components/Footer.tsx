import { Linkedin, Twitter, Github, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Footer = () => {
  return (
    <footer className="mt-auto py-12 px-4 border-t border-border bg-background">
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
                src="/badges/soc2-badge.webp" 
                alt="SOC 2 Compliant" 
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
              <div className="hover:text-foreground cursor-pointer transition-colors">AI Agents</div>
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
              <div className="hover:text-foreground cursor-pointer transition-colors">Documentation</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">API Reference</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Academy</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Status Page</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Changelog</div>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">Company</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="hover:text-foreground cursor-pointer transition-colors">Blog</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Careers</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">About Us</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Get a Demo</div>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">Legal</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/privacy" className="block hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="block hover:text-foreground transition-colors">Terms</Link>
              <Link to="/promptbox-dpa" className="block hover:text-foreground transition-colors">Promptbox DPA</Link>
              <div className="hover:text-foreground cursor-pointer transition-colors">OpenAI DPA</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">Anthropic DPA</div>
              <div className="hover:text-foreground cursor-pointer transition-colors">SOC 2 Report</div>
            </div>
          </div>
        </div>

        {/* Bottom section with logo, copyright, and social */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-border">
          <div className="flex items-center gap-8">
            <img 
              src="/lovable-uploads/2e7ad5f9-215d-4361-bcc3-b84d6328849c.png" 
              alt="PROMPTBOX" 
              className="h-8 w-auto"
            />
            <p className="text-sm text-muted-foreground">
              ©2025 PROMPTBOX. All rights reserved
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              All Systems Operational
            </div>
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