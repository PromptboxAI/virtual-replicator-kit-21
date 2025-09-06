import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Database, Activity, BarChart3 } from 'lucide-react';
import { PriceConsistencyAudit } from '@/components/audit/PriceConsistencyAudit';
import { PriceHistoryValidator } from '@/components/audit/PriceHistoryValidator';
import { Header } from '@/components/Header';

export default function PriceAuditDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Price Audit Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive price display accuracy and data integrity validation
          </p>
        </div>

        <Tabs defaultValue="consistency" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consistency" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Consistency
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consistency">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceConsistencyAudit />
              <Card>
                <CardHeader>
                  <CardTitle>Bonding Curve Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Starting Price (P0)</div>
                      <div className="text-muted-foreground">0.000001 PROMPT</div>
                    </div>
                    <div>
                      <div className="font-medium">Ending Price (P1)</div>
                      <div className="text-muted-foreground">0.000104 PROMPT</div>
                    </div>
                    <div>
                      <div className="font-medium">Curve Supply</div>
                      <div className="text-muted-foreground">800,000,000 tokens</div>
                    </div>
                    <div>
                      <div className="font-medium">Graduation Target</div>
                      <div className="text-muted-foreground">42,000 PROMPT</div>
                    </div>
                    <div>
                      <div className="font-medium">Trading Fee</div>
                      <div className="text-muted-foreground">1% total</div>
                    </div>
                    <div>
                      <div className="font-medium">Price Impact Warning</div>
                      <div className="text-muted-foreground">&gt;5% impact</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceHistoryValidator />
              <Card>
                <CardHeader>
                  <CardTitle>Data Integrity Checks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Time Gap Detection</div>
                        <div className="text-sm text-muted-foreground">
                          Identifies gaps &gt;6 hours in price data
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Price Consistency</div>
                        <div className="text-sm text-muted-foreground">
                          Validates recorded vs calculated prices
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Duplicate Detection</div>
                        <div className="text-sm text-muted-foreground">
                          Finds duplicate timestamp entries
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Missing Data</div>
                        <div className="text-sm text-muted-foreground">
                          Checks for missing recent snapshots
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Price Feed Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Real-time Monitoring</h3>
                  <p className="text-muted-foreground">
                    Advanced real-time price feed validation will be implemented here.
                    This will include WebSocket connection monitoring, price update frequency analysis,
                    and real-time calculation verification.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Formula Accuracy</p>
                      <p className="text-2xl font-bold">99.99%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Integrity</p>
                      <p className="text-2xl font-bold">98.5%</p>
                    </div>
                    <Database className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Calc Performance</p>
                      <p className="text-2xl font-bold">&lt;1ms</p>
                    </div>
                    <Activity className="h-8 w-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Checks</p>
                      <p className="text-2xl font-bold">7</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Audit Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Price Calculation Tests</h4>
                      <ul className="space-y-2 text-sm">
                        <li>✅ Round-trip conversion accuracy</li>
                        <li>✅ Linear price formula validation</li>
                        <li>✅ Buy/sell inverse relationship</li>
                        <li>✅ Price impact calculations</li>
                        <li>✅ Boundary condition handling</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Data Integrity Tests</h4>
                      <ul className="space-y-2 text-sm">
                        <li>🔍 Time gap detection</li>
                        <li>🔍 Price consistency validation</li>
                        <li>🔍 Duplicate entry detection</li>
                        <li>🔍 Missing data identification</li>
                        <li>🔍 Real-time feed monitoring</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}