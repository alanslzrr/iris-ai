"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TimelineData {
  chartData: Array<{ date: string; PASS: number; FAIL: number; ATTENTION: number; UNKNOWN: number }>;
  summary: { totalProcessed: number; averageDaily: number };
}

interface Panel2Response {
  processingTimeline: TimelineData;
}

export function ProcessingTimelineOverview() {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30d");
  const isMobile = useIsMobile();
  const abortRef = useRef<AbortController | null>(null);

  // Mobile default to 7d
  useEffect(() => {
    if (isMobile) setTimeRange("7d");
  }, [isMobile]);

  // Fetch data whenever range changes
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setError(null);
        setFetching(true);
        if (!timeline) setLoading(true);

        // cancel any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch(`/api/dashboard/panel2-analysis?range=${encodeURIComponent(timeRange)}` , { signal: controller.signal });
        const json = await res.json();
        if (json.success) {
          const data = (json.data as Panel2Response).processingTimeline;
          setTimeline(data);
        } else {
          setError(json.error || "Failed to fetch processing timeline");
        }
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          setError("Failed to fetch processing timeline");
        }
      } finally {
        setLoading(false);
        setFetching(false);
      }
    };
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const timelineChartConfig = {
    PASS: { label: "Pass", color: "var(--chart-1)" },
    FAIL: { label: "Fail", color: "var(--chart-2)" },
    ATTENTION: { label: "Attention", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <Card className="@container/card shadow-xs">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-56 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !timeline) {
    return null;
  }

  const descriptionByRange: Record<string, string> = {
    "90d": "Last 3 months",
    "30d": "Last 30 days",
    "7d": "Last 7 days",
  };

  return (
    <Card className="@container/card shadow-xs">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Processing Timeline</CardTitle>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(v) => v && setTimeRange(v)}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-3 @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
              <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 h-8 @[767px]/card:hidden" aria-label="Select range">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setTimeRange(timeRange)} disabled={fetching} title="Refresh timeline">
              <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>Daily processing volume by status • {descriptionByRange[timeRange]}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={timelineChartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={timeline.chartData} margin={{ left: 4, right: 4 }}>
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
                const date = new Date(value as string);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                  indicator="dot"
                />
              }
            />
            <Area dataKey="PASS" type="natural" fill="url(#fillPass)" stroke="var(--color-PASS)" stackId="a" isAnimationActive animationDuration={500} animationEasing="ease-in-out" />
            <Area dataKey="FAIL" type="natural" fill="url(#fillFail)" stroke="var(--color-FAIL)" stackId="a" isAnimationActive animationDuration={500} animationEasing="ease-in-out" />
            <Area dataKey="ATTENTION" type="natural" fill="url(#fillAttention)" stroke="var(--color-ATTENTION)" stackId="a" isAnimationActive animationDuration={500} animationEasing="ease-in-out" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


