import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Mail, Wallet, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';

export function OnboardingGuide() {
  const { user, authenticated, signIn, linkWallet } = useAuth();
  const { hasExternalWallet } = usePrivyWallet();

  const steps = [
    {
      id: 'email',
      title: 'Sign up with email',
      description: 'Create your account using your email address',
      completed: authenticated,
      icon: Mail,
      action: !authenticated ? signIn : undefined,
      actionText: 'Sign Up / Sign In'
    },
    {
      id: 'wallet',
      title: 'Connect external wallet',
      description: 'Link your wallet to create an AI Agent',
      completed: hasExternalWallet,
      icon: Wallet,
      action: authenticated && !hasExternalWallet ? linkWallet : undefined,
      actionText: 'Connect Wallet',
      disabled: !authenticated
    }
  ];

  const isComplete = steps.every(step => step.completed);

  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Setup Complete!</p>
              <p className="text-green-600 text-sm">You're ready to create and trade agents.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Getting Started</span>
          <Badge variant="secondary" className="text-xs">
            {steps.filter(s => s.completed).length}/{steps.length} Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.id} className="relative">
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2 
                      ${step.completed 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : step.disabled
                        ? 'bg-gray-100 border-gray-300 text-gray-400'
                        : 'bg-blue-100 border-blue-500 text-blue-700'
                      }
                    `}>
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`
                        w-0.5 h-8 mt-2
                        ${step.completed ? 'bg-green-200' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-h-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`
                          font-medium 
                          ${step.completed 
                            ? 'text-green-800' 
                            : step.disabled 
                            ? 'text-gray-400' 
                            : 'text-foreground'
                          }
                        `}>
                          {step.title}
                        </h4>
                        <p className={`
                          text-sm 
                          ${step.completed 
                            ? 'text-green-600' 
                            : step.disabled 
                            ? 'text-gray-400' 
                            : 'text-muted-foreground'
                          }
                        `}>
                          {step.description}
                        </p>
                      </div>
                      
                      {step.action && (
                        <Button 
                          size="sm" 
                          onClick={step.action}
                          disabled={step.disabled}
                        >
                          {step.actionText}
                          <ArrowRight className="ml-2 w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}