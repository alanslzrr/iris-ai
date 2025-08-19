"use client";

import { useEffect, useState } from 'react';
import { usePreferencesStore } from '@/stores/preferences/preferences-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { BarChart3, RefreshCw, AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Panel2Data {
  statusDistribution: {
    chartData: Array<{status: string; count: number; color: string}>;
    summary: Record<string, number>;
  };
  keyIndicators: {
    totalEvaluated: number;
    failRate: number;
    attentionRate: number;
  };
  processingTimeline: {
    chartData: Array<{date: string; PASS: number; FAIL: number; ATTENTION: number; UNKNOWN: number}>;
    summary: {totalProcessed: number; averageDaily: number};
  };
  validationCriteria: {
    tolerance: {PASS: number; FAIL: number; UNKNOWN: number};
    requirements: {PASS: number; FAIL: number; UNKNOWN: number};
    cmc: {PASS: number; FAIL: number; UNKNOWN: number};
  };
  equipmentTypePerformance: {
    chartData: Array<{equipmentType: string; PASS: number; FAIL: number; ATTENTION: number; UNKNOWN: number; total: number}>;
    summary: {totalTypes: number; topType: string};
  };
}

export function ModernChartsSection() {
  const [panel2Data, setPanel2Data] = useState<Panel2Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const isMobile = useIsMobile();
  const { liveOnly } = usePreferencesStore();

  const fetchPanel2Data = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const liveQuery = liveOnly ? `&live=1` : '';
      const response = await fetch(`/api/dashboard/panel2-analysis?range=${timeRange}${liveQuery}`);
      const data = await response.json();
      
      if (data.success) {
        setPanel2Data(data.data);
      } else {
        setError(data.error || 'Failed to fetch analysis data');
      }
    } catch (err) {
      setError('Failed to fetch analysis data');
      console.error('Error fetching panel 2 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanel2Data();
  }, [timeRange, liveOnly]);

  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-muted rounded animate-pulse" />
            <div className="h-9 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Key indicators skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="@container/card animate-pulse shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart skeleton */}
        <Card className="@container/card animate-pulse shadow-xs">
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Charts</CardTitle>
          </div>
          <CardDescription className="text-destructive/80">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button 
            onClick={fetchPanel2Data}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!panel2Data) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="h-4 w-4 text-[var(--color-PASS)]" />;
      case 'FAIL': return <AlertTriangle className="h-4 w-4 text-[var(--color-FAIL)]" />;
      case 'ATTENTION': return <Clock className="h-4 w-4 text-[var(--color-ATTENTION)]" />;
      default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderStatusBadge = (status: string) => (
    <Badge variant="outline" className="px-1.5 text-foreground">
      {getStatusIcon(status)}
      {status}
    </Badge>
  );

  // Chart configuration for the processing timeline
  const timelineChartConfig = {
    PASS: {
      label: "Pass",
      color: "var(--chart-1)",
    },
    FAIL: {
      label: "Fail", 
      color: "var(--chart-2)",
    },
    ATTENTION: {
      label: "Attention",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8">
      {/* Controls (title/description removed to avoid duplication with page header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchPanel2Data} className="shadow-xs">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="@container/card shadow-xs hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{panel2Data.keyIndicators.totalEvaluated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Certificates processed</p>
          </CardContent>
        </Card>
        <Card className="@container/card shadow-xs hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fail Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{panel2Data.keyIndicators.failRate}%</div>
            <p className="text-xs text-muted-foreground">Failed evaluations</p>
          </CardContent>
        </Card>
        <Card className="@container/card shadow-xs hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attention Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{panel2Data.keyIndicators.attentionRate}%</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="timeline">Processing Timeline</TabsTrigger>
          <TabsTrigger value="criteria">Validation Criteria</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Types</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card className="@container/card shadow-xs">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Breakdown of evaluation results by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {panel2Data.statusDistribution.chartData.map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold tabular-nums">{item.count}</span>
                      <Badge variant="outline">
                        {panel2Data.keyIndicators.totalEvaluated > 0 ? 
                          Math.round((item.count / panel2Data.keyIndicators.totalEvaluated) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card className="@container/card shadow-xs">
            <CardHeader>
              <CardTitle>Processing Timeline</CardTitle>
              <CardDescription>Daily processing volume by status</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-muted-foreground">Total Processed</p>
                    <p className="text-2xl font-bold tabular-nums">{panel2Data.processingTimeline.summary.totalProcessed}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-muted-foreground">Average Daily</p>
                    <p className="text-2xl font-bold tabular-nums">{panel2Data.processingTimeline.summary.averageDaily}</p>
                  </div>
                </div>
                <ChartContainer config={timelineChartConfig} className="aspect-auto h-[250px] w-full">
                  <AreaChart data={panel2Data.processingTimeline.chartData}>
                    <defs>
                      <linearGradient id="fillPass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-PASS)" stopOpacity={1.0} />
                        <stop offset="95%" stopColor="var(--color-PASS)" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="fillFail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-FAIL)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-FAIL)" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="fillAttention" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-ATTENTION)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-ATTENTION)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      defaultIndex={isMobile ? -1 : 10}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                          }}
                          indicator="dot"
                        />
                      }
                    />
                    <Area dataKey="PASS" type="natural" fill="url(#fillPass)" stroke="var(--color-PASS)" stackId="a" />
                    <Area dataKey="FAIL" type="natural" fill="url(#fillFail)" stroke="var(--color-FAIL)" stackId="a" />
                    <Area dataKey="ATTENTION" type="natural" fill="url(#fillAttention)" stroke="var(--color-ATTENTION)" stackId="a" />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="criteria" className="space-y-4">
          <Card className="@container/card shadow-xs">
            <CardHeader>
              <CardTitle>Validation Criteria Breakdown</CardTitle>
              <CardDescription>Performance by validation criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(panel2Data.validationCriteria).map(([criterion, data]) => (
                  <div key={criterion} className="space-y-2">
                    <h4 className="font-medium capitalize">{criterion} Validation</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{data.PASS}</div>
                        <div className="text-muted-foreground">Pass</div>
                      </div>
                      <div className="text-center p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">{data.FAIL}</div>
                        <div className="text-muted-foreground">Fail</div>
                      </div>
                      <div className="text-center p-3 rounded-lg border bg-muted/30">
                        <div className="text-2xl font-bold text-muted-foreground tabular-nums">{data.UNKNOWN}</div>
                        <div className="text-muted-foreground">Unknown</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card className="@container/card shadow-xs">
            <CardHeader>
              <CardTitle>Equipment Type Performance</CardTitle>
              <CardDescription>Top equipment types by processing volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground p-3 rounded-lg border bg-muted/30">
                  Top type: <span className="font-medium">{panel2Data.equipmentTypePerformance.summary.topType}</span>
                </div>
                <div className="space-y-3">
                  {panel2Data.equipmentTypePerformance.chartData.slice(0, 5).map((item) => (
                    <div key={item.equipmentType} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <span className="font-medium">{item.equipmentType}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.total}</Badge>
                        <div className="text-xs text-muted-foreground">
                          {item.PASS}P/{item.FAIL}F/{item.ATTENTION}A
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 