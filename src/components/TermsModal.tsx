import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
}

export function TermsModal({ open, onAccept }: TermsModalProps) {
  const handleTermsClick = () => {
    // Open terms in new tab (you can replace with your actual terms URL)
    window.open('/terms', '_blank');
  };

  const handlePoliciesClick = () => {
    // Open policies in new tab (you can replace with your actual policies URL)
    window.open('/privacy-policy', '_blank');
  };

  return (
    <Dialog open={open} modal={false}>
      <DialogContent className="sm:max-w-md [&>button]:hidden bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-center">Welcome to PromptBox</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Please review and accept our terms and policies to continue.
          </p>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={handleTermsClick}
            >
              <span>Terms of Service</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={handlePoliciesClick}
            >
              <span>Privacy Policy</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            By clicking "Accept and Continue", you agree to our Terms of Service and Privacy Policy.
          </p>
          
          <Button 
            onClick={onAccept}
            className="w-full"
          >
            Accept and Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}