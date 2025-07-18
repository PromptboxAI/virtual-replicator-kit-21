const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border bg-white" style={{ backgroundColor: '#ffffff' }}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <div className="text-2xl font-bold text-foreground">
                PROMPTBOX
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
        </div>
      </div>
    </footer>
  );
};

export { Footer };