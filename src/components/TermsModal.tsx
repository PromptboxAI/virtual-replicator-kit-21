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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);

  const handleTermsClick = () => {
    // Open terms in new tab (you can replace with your actual terms URL)
    window.open('/terms', '_blank');
    setTermsAccepted(true);
  };

  const handlePoliciesClick = () => {
    // Open policies in new tab (you can replace with your actual policies URL)
    window.open('/privacy-policy', '_blank');
    setPoliciesAccepted(true);
  };

  const canProceed = termsAccepted && policiesAccepted;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">Welcome to PromptBox</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Please review and accept our terms and policies to continue.
          </p>
          
          <div className="space-y-4">
            <Button
              variant={termsAccepted ? "default" : "outline"}
              className="w-full justify-between"
              onClick={handleTermsClick}
            >
              <span>Terms of Service</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant={policiesAccepted ? "default" : "outline"}
              className="w-full justify-between"
              onClick={handlePoliciesClick}
            >
              <span>Privacy Policy</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${termsAccepted ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Terms of Service {termsAccepted ? 'reviewed' : 'pending'}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${policiesAccepted ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Privacy Policy {policiesAccepted ? 'reviewed' : 'pending'}</span>
            </div>
          </div>
          
          <Button 
            onClick={onAccept}
            disabled={!canProceed}
            className="w-full"
          >
            Accept and Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}