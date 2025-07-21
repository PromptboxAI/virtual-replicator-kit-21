import React from 'react';
import { V2ContractTester } from '@/components/V2ContractTester';
import { AgentMigrationManager } from '@/components/AgentMigrationManager';
import { NewAgentCreator } from '@/components/NewAgentCreator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, ArrowUpDown, Sparkles, Zap } from 'lucide-react';

export default function TestLab() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TestTube className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Agent V2 Test Lab</h1>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Beta
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Test, deploy, and migrate agent tokens with enhanced V2 features including 
          slippage protection and improved bonding curves.
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create V2 Agent
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Test Suite
          </TabsTrigger>
          <TabsTrigger value="migrate" className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Migration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Create New V2 Agent
              </CardTitle>
              <CardDescription>
                Deploy agents with the latest V2 token contract featuring slippage protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewAgentCreator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <V2ContractTester />
        </TabsContent>

        <TabsContent value="migrate" className="space-y-6">
          <AgentMigrationManager />
        </TabsContent>
      </Tabs>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            V1 vs V2 Feature Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-center p-2">V1</th>
                  <th className="text-center p-2">V2</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="p-2 font-medium">Slippage Protection</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Enhanced Bonding Curve</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Gas Optimization</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Improved</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Transaction Lifecycle</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Enhanced</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Migration Support</td>
                  <td className="text-center p-2">❌</td>
                  <td className="text-center p-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Error Handling</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Comprehensive</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}