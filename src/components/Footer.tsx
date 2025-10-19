import { Shield, FileCheck, Cross } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border bg-white" style={{ backgroundColor: '#ffffff' }}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div>
            <div className="mb-4">
              <img 
                src="/lovable-uploads/2e7ad5f9-215d-4361-bcc3-b84d6328849c.png" 
                alt="PROMPTBOX" 
                className="h-12 w-auto mb-2"
              />
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <FileCheck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <Cross className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <p className="text-sm font-normal tracking-normal" style={{ color: '#000000' }}>
              Building the future of autonomous AI agent commerce and collaboration.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>AI Agents</div>
              <div>ACP Protocol</div>
              <div>PROMPT Framework</div>
              <div>Governance</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Developers</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Documentation</div>
              <div>API Reference</div>
              <div>SDK</div>
              <div>Support</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Community</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Discord</div>
              <div>Twitter</div>
              <div>GitHub</div>
              <div>Blog</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Privacy</div>
              <div>Terms</div>
              <div>Referral Terms</div>
              <div>OpenAI DPA</div>
              <div>Anthropic DPA</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };