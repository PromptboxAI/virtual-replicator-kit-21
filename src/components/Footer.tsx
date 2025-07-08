const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-gray-100" style={{ backgroundColor: '#F5FFF9' }}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-foreground mb-4">
              © PromptBox 2025
            </div>
            <p className="text-muted-foreground text-sm">
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
        </div>
      </div>
    </footer>
  );
};

export { Footer };