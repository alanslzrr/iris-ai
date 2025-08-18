"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { usePhoenixLiveSet } from "@/hooks/usePhoenixLiveSet";

type CriteriaCounts = { PASS: number; FAIL: number; UNKNOWN: number };

interface Panel2Data {
  statusDistribution: {
    chartData: Array<{ status: string; count: number; color: string }>;
    summary: Record<string, number>;
  };
  keyIndicators: {
    totalEvaluated: number;
    failRate: number;
    attentionRate: number;
  };
  processingTimeline: {
    chartData: Array<{
      date: string;
      PASS: number;
      FAIL: number;
      ATTENTION: number;
      UNKNOWN: number;
    }>;
    summary: { totalProcessed: number; averageDaily: number };
  };
  validationCriteria: {
    tolerance: CriteriaCounts;
    requirements: CriteriaCounts;
    cmc: CriteriaCounts;
  };
  equipmentTypePerformance: {
    chartData: Array<{
      equipmentType: string;
      PASS: number;
      FAIL: number;
      ATTENTION: number;
      UNKNOWN: number;
      total: number;
    }>;
    summary: { totalTypes: number; topType: string };
  };
}

export default function AnalyticsOverview() {
  const [data, setData] = useState<Panel2Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [timelineMode, setTimelineMode] = useState<"volume" | "proportion">(
    "volume"
  );
  const isMobile = useIsMobile();
  const abortRef = useRef<AbortController | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const { set: phoenixSet } = usePhoenixLiveSet();

  useEffect(() => {
    if (isMobile) setTimeRange("7d");
  }, [isMobile]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setFetching(true);
        if (!data) setLoading(true);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const liveQuery = liveOnly ? `&live=1` : '';
        const res = await fetch(`/api/dashboard/panel2-analysis?range=${encodeURIComponent(timeRange)}${liveQuery}`,
          { signal: controller.signal });
        const json = await res.json();
        if (json.success) {
          setData(json.data as Panel2Data);
        } else {
          setError(json.error || "Failed to fetch analytics data");
        }
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          setError("Failed to fetch analytics data");
        }
      } finally {
        setLoading(false);
        setFetching(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, reloadKey, liveOnly]);

  const kpiItems = useMemo(() => {
    if (!data) return [] as Array<{ label: string; value: string; help?: string }>;
    const { keyIndicators, processingTimeline } = data;
    return [
      { label: "Total Evaluated", value: keyIndicators.totalEvaluated.toLocaleString() },
      { label: "Fail Rate", value: `${keyIndicators.failRate.toFixed(1)}%` },
      { label: "Attention Rate", value: `${keyIndicators.attentionRate.toFixed(1)}%` },
      { label: "Avg Daily Processed", value: processingTimeline.summary.averageDaily.toFixed(1) },
    ];
  }, [data]);

  const statusChartConfig = useMemo(() => ({
    count: { label: "Count", color: "var(--chart-1)" },
    label: { color: "var(--background)" },
  }) satisfies ChartConfig, []);

  const criteriaChartConfig = useMemo(() => ({
    PASS: { label: "Pass", color: "var(--chart-1)" },
    FAIL: { label: "Fail", color: "var(--chart-2)" },
    UNKNOWN: { label: "Unknown", color: "var(--chart-3)" },
  }) satisfies ChartConfig, []);

  const timelineChartConfig = useMemo(() => ({
    PASS: { label: "Pass", color: "var(--chart-1)" },
    FAIL: { label: "Fail", color: "var(--chart-2)" },
    ATTENTION: { label: "Attention", color: "var(--chart-3)" },
    rolling: { label: "7d avg", color: "var(--chart-4)" },
  }) satisfies ChartConfig, []);

  const statusData = useMemo(
    () => (data ? [...data.statusDistribution.chartData]
      .sort((a, b) => b.count - a.count)
      .map((d) => ({ label: d.status, count: d.count })) : []),
    [data]
  );

  // Derived: timeline proportion and rolling average
  const timelineDisplayData = useMemo(() => {
    if (!data) return [] as Array<any>;
    const base = data.processingTimeline.chartData.map((d) => {
      const total = d.PASS + d.FAIL + d.ATTENTION + d.UNKNOWN;
      if (timelineMode === "proportion" && total > 0) {
        return {
          date: d.date,
          PASS: (d.PASS / total) * 100,
          FAIL: (d.FAIL / total) * 100,
          ATTENTION: (d.ATTENTION / total) * 100,
        };
      }
      return {
        date: d.date,
        PASS: d.PASS,
        FAIL: d.FAIL,
        ATTENTION: d.ATTENTION,
        total,
      };
    });

    // 7-day rolling average of total (only meaningful in volume mode)
    if (timelineMode === "volume") {
      const window = 7;
      let runningSum = 0;
      const queue: number[] = [];
      return base.map((d) => {
        const value = d.total ?? d.PASS + d.FAIL + d.ATTENTION;
        queue.push(value);
        runningSum += value;
        if (queue.length > window) runningSum -= queue.shift() as number;
        const rolling = runningSum / queue.length;
        return { ...d, rolling };
      });
    }
    return base;
  }, [data, timelineMode]);

  // Derived: validation criteria pass rate per criterion
  const criteriaWithRate = useMemo(() => {
    if (!data) {
      return [] as Array<{
        name: string;
        PASS: number;
        FAIL: number;
        UNKNOWN: number;
        passRate: number;
      }>;
    }
    const items = [
      { name: "Tolerance", ...data.validationCriteria.tolerance },
      { name: "Requirements", ...data.validationCriteria.requirements },
      { name: "CMC", ...data.validationCriteria.cmc },
    ];
    return items.map((it) => {
      const denom = (it.PASS || 0) + (it.FAIL || 0) + (it.UNKNOWN || 0);
      const passRate = denom > 0 ? (it.PASS / denom) * 100 : 0;
      return { ...it, passRate };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="h-6 w-36 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
            </div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-[220px] bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
          </div>
          <CardDescription className="text-destructive/80">{error || "Unexpected error"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const criteriaData = [
    { name: "Tolerance", ...data.validationCriteria.tolerance },
    { name: "Requirements", ...data.validationCriteria.requirements },
    { name: "CMC", ...data.validationCriteria.cmc },
  ];

  const topEquipment = [...data.equipmentTypePerformance.chartData]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-2 py-4 md:gap-3 md:py-6">
        <div className="flex items-center justify-between px-2 md:px-0">
          <div className="flex items-center gap-3">
            <CardTitle>Analytics</CardTitle>
            {fetching && <Badge variant="secondary" className="ml-1">Updating…</Badge>}
            <div className="ml-2 flex items-center gap-2">
              <Switch checked={liveOnly} onCheckedChange={setLiveOnly} />
              <span className="text-sm text-muted-foreground">Live{liveOnly && !phoenixSet ? ' (loading...)' : ''}</span>
            </div>
          </div>
          <ToggleGroup type="single" value={timeRange} onValueChange={(v) => v && setTimeRange(v)} className="hidden sm:flex">
            <ToggleGroupItem value="7d" aria-label="Last 7 days">7d</ToggleGroupItem>
            <ToggleGroupItem value="30d" aria-label="Last 30 days">30d</ToggleGroupItem>
            <ToggleGroupItem value="90d" aria-label="Last 90 days">90d</ToggleGroupItem>
          </ToggleGroup>
          <div className="sm:hidden min-w-[140px]">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpiItems.map((kpi) => (
            <Card key={kpi.label} className="shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl">{kpi.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Separator className="my-2 md:my-4" />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Processing Timeline</CardTitle>
              <CardDescription>PASS / FAIL / ATTENTION over time</CardDescription>
              <div className="mt-2">
                <ToggleGroup
                  type="single"
                  value={timelineMode}
                  onValueChange={(v) => v && setTimelineMode(v as typeof timelineMode)}
                >
                  <ToggleGroupItem value="volume" aria-label="Volume">Volume</ToggleGroupItem>
                  <ToggleGroupItem value="proportion" aria-label="Proportion">Proportion</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={timelineChartConfig} className="aspect-auto h-[250px] w-full">
                <AreaChart data={timelineDisplayData} margin={{ left: 4, right: 4 }}>
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
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32}
                    tickFormatter={(value) => new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <ChartTooltip cursor={false} defaultIndex={isMobile ? -1 : 10}
                    content={<ChartTooltipContent labelFormatter={(value) => new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })} indicator="dot" />} />
                  <Area dataKey="PASS" type="natural" fill="url(#fillPass)" stroke="var(--color-PASS)" stackId="a" />
                  <Area dataKey="FAIL" type="natural" fill="url(#fillFail)" stroke="var(--color-FAIL)" stackId="a" />
                  <Area dataKey="ATTENTION" type="natural" fill="url(#fillAttention)" stroke="var(--color-ATTENTION)" stackId="a" />
                  {timelineMode === "volume" && (
                    <Line type="monotone" dataKey="rolling" stroke="var(--color-rolling)" dot={false} strokeWidth={2} />
                  )}
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Overall status counts</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusChartConfig} className="aspect-auto h-[250px] w-full">
                <BarChart accessibilityLayer data={statusData} layout="vertical" margin={{ right: 16 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                  <XAxis dataKey="count" type="number" hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                    <LabelList dataKey="label" position="insideLeft" offset={8} className="fill-[var(--color-label)]" fontSize={12} />
                    <LabelList dataKey="count" position="right" offset={8} className="fill-foreground" fontSize={12} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Validation Criteria</CardTitle>
              <CardDescription>Pass / Fail / Unknown by criterion</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                ...criteriaChartConfig,
                passRate: { label: "Pass Rate", color: "var(--chart-4)" },
              }} className="aspect-auto h-[280px] w-full">
                <BarChart accessibilityLayer data={criteriaWithRate}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
                  <Bar dataKey="PASS" yAxisId="left" fill="var(--color-PASS)" />
                  <Bar dataKey="FAIL" yAxisId="left" fill="var(--color-FAIL)" />
                  <Bar dataKey="UNKNOWN" yAxisId="left" fill="var(--color-UNKNOWN)" />
                  <Line type="monotone" yAxisId="right" dataKey="passRate" stroke="var(--color-passRate)" strokeWidth={2} dot={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        className="w-[180px]"
                        formatter={(value, name, item, index) => (
                          <>
                            <div className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--color-bg)]" style={{ "--color-bg": `var(--color-${name})` } as React.CSSProperties } />
                            {criteriaChartConfig[name as keyof typeof criteriaChartConfig]?.label || name}
                            <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">{value as number}</div>
                            {index === 2 && (
                              <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                                Total
                                <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                                  {(item.payload.PASS || 0) + (item.payload.FAIL || 0) + (item.payload.UNKNOWN || 0)}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      />
                    }
                    cursor={false}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Equipment Types</CardTitle>
              <CardDescription>Pareto: Bars (count) + cumulative %</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ total: { label: "Total", color: "var(--chart-4)" }, cumulative: { label: "Cumulative", color: "var(--chart-2)" }, label: { color: "var(--background)" } } as ChartConfig} className="aspect-auto h-[280px] w-full">
                {
                  (() => {
                    const all = topEquipment.reduce((s, d) => s + d.total, 0) || 1;
                    let acc = 0;
                    const pareto = topEquipment.map((d) => {
                      acc += d.total;
                      return { label: d.equipmentType, total: d.total, cumulative: (acc / all) * 100 };
                    });
                    return (
                      <BarChart accessibilityLayer data={pareto} layout="vertical" margin={{ right: 24 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} />
                        <XAxis xAxisId="left" type="number" orientation="bottom" />
                        <XAxis xAxisId="right" type="number" orientation="top" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Bar dataKey="total" fill="var(--color-total)" radius={4} xAxisId="left">
                          <LabelList dataKey="label" position="insideLeft" offset={8} className="fill-[var(--color-label)]" fontSize={12} />
                          <LabelList dataKey="total" position="right" offset={8} className="fill-foreground" fontSize={12} />
                        </Bar>
                        <Line type="monotone" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={2} dot={false} xAxisId="right" />
                      </BarChart>
                    );
                  })()
                }
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
