import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Target, AlertTriangle } from 'lucide-react';

export const TestingGuide = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Comprehensive Testing Guide
        </CardTitle>
        <CardDescription>
          Step-by-step testing scenarios for thorough validation of the PROMPT token system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Test Scenario Categories */}
        <div className="grid gap-4">
          
          {/* Low Raise Testing */}
          <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Low Raise Testing (5K - 15K PROMPT)</h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Test bonding curve accuracy and basic trading mechanics
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">5,000 PROMPT</Badge>
                <Badge variant="secondary" className="text-xs">10,000 PROMPT</Badge>
                <Badge variant="secondary" className="text-xs">15,000 PROMPT</Badge>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Expected:</strong> Smooth price increases, accurate token calculations, proper balance updates
              </p>
            </div>
          </div>

          {/* Mid Raise Testing */}
          <div className="p-4 rounded-lg border bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Mid Raise Testing (20K - 35K PROMPT)</h3>
            </div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              Test approaching graduation threshold behavior
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">20,000 PROMPT</Badge>
                <Badge variant="secondary" className="text-xs">30,000 PROMPT</Badge>
                <Badge variant="secondary" className="text-xs">35,000 PROMPT</Badge>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Expected:</strong> Higher prices, graduation warnings, system stability under load
              </p>
            </div>
          </div>

          {/* Graduation Testing */}
          <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Graduation Testing (42K+ PROMPT)</h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mb-3">
              Test full graduation flow and DEX deployment
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <Badge variant="default" className="text-xs bg-green-600">42,000 PROMPT (Exact)</Badge>
                <Badge variant="secondary" className="text-xs">42,001 PROMPT</Badge>
                <Badge variant="secondary" className="text-xs">50,000 PROMPT</Badge>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>Expected:</strong> Graduation trigger, DEX deployment, LP creation, platform allocation
              </p>
            </div>
          </div>

          {/* Edge Cases */}
          <div className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Edge Cases & Stress Testing</h3>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              Test system limits and error handling
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <Badge variant="destructive" className="text-xs">100,000 PROMPT</Badge>
                <Badge variant="secondary" className="text-xs">Zero amounts</Badge>
                <Badge variant="secondary" className="text-xs">Negative values</Badge>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                <strong>Expected:</strong> Proper error handling, system stability, security measures
              </p>
            </div>
          </div>
        </div>

        {/* Testing Checklist */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <h3 className="font-semibold mb-3">Testing Checklist</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Off-chain balance updates correctly after trades</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Bonding curve price calculations are accurate</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Graduation trigger works at 42,000 PROMPT</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Platform allocation (4M tokens) is created</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>DEX integration functions properly</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Error handling works for edge cases</span>
            </div>
          </div>
        </div>

        {/* Current Test Status */}
        <div className="p-4 rounded-lg border bg-primary/5">
          <h3 className="font-semibold mb-2">🚀 Ready for Testing!</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">✅ Off-chain balance:</span> <strong>200,000 PROMPT</strong>
            </div>
            <div>
              <span className="text-muted-foreground">⚠️ On-chain tokens:</span> <strong>Mint via faucet above</strong>
            </div>
            <div>
              <span className="text-muted-foreground">✅ Deployer wallet:</span> <strong>Ready</strong>
            </div>
            <div>
              <span className="text-muted-foreground">✅ Test agents:</span> <strong>Can create unlimited</strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};