"use client";

import { useEffect, useState } from 'react';
import { usePreferencesStore } from '@/stores/preferences/preferences-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  AlertTriangle,
  BarChart3,
  Activity,
  Database,
  RefreshCw
} from "lucide-react";
import type { DateRange } from 'react-day-picker';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
  className?: string;
}

function MetricCard({ title, value, description, trend, badge, className }: MetricCardProps) {
  
  return (
    <Card className={cn("@container/card group relative overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200", className)}>
      <CardHeader>
        <CardDescription className="text-sm font-medium text-muted-foreground">{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
        <CardAction>
          {badge && (
            <Badge variant={badge.variant} className="px-1.5">
              {trend && (
                <>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                </>
              )}
              {badge.text}
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {trend && (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trend.isPositive ? (
              <>
                <TrendingUp className="size-4" />
                +{trend.value}%
              </>
            ) : (
              <>
                <TrendingDown className="size-4" />
                {trend.value}%
              </>
            )}
            from last month
          </div>
        )}
        <div className="text-muted-foreground">{description}</div>
      </CardFooter>
    </Card>
  );
}

interface Panel1Data {
  volume: {
    totalPhoenix: number;
    totalSupabase: number;
    matching: number;
    pendingProcessing: number;
  };
  processingCoverage: {
    rate: number;
    chartData: Array<{category: string; value: number; color: string}>;
  };
  dailyEvolution: {
    chartData: Array<{date: string; phoenixCount: number; supabaseCount: number; processingRate: number}>;
    summary: {averageDaily: number};
  };
}

interface ModernMetricsCardsProps {
  dateRange?: DateRange;
}

export function ModernMetricsCards({ dateRange }: ModernMetricsCardsProps) {
  const [panel1Data, setPanel1Data] = useState<Panel1Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { liveOnly, setLiveOnly } = usePreferencesStore();

  const fetchPanel1Data = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (dateRange?.from) params.set('from', new Date(dateRange.from).toISOString());
      if (dateRange?.to) params.set('to', new Date(dateRange.to).toISOString());
      if (!dateRange?.from && !dateRange?.to) params.set('range', '30d');
      const query = params.toString();
      const response = await fetch(`/api/dashboard/panel1-integration${query ? `?${query}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        setPanel1Data(data.data);
      } else {
        setError(data.error || 'Failed to fetch integration data');
      }
    } catch (err) {
      setError('Failed to fetch integration data');
      console.error('Error fetching panel 1 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanel1Data();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange?.from?.toString(), dateRange?.to?.toString()]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card animate-pulse shadow-xs">
            <CardHeader>
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              <div className="h-6 w-12 bg-muted rounded animate-pulse ml-auto" />
            </CardHeader>
            <CardFooter>
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Metrics</CardTitle>
          </div>
          <CardDescription className="text-destructive/80">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button 
            onClick={fetchPanel1Data}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!panel1Data) return null;

  const processedValue = liveOnly
    ? panel1Data.volume.matching
    : panel1Data.volume.totalSupabase;

  const processedDescription = liveOnly
    ? "Certificates evaluated that are Live"
    : "Certificates evaluated";

  const rangeLabel = ((): string => {
    if (dateRange?.from && dateRange?.to) return 'in range';
    if (dateRange?.from && !dateRange?.to) return 'from selected date';
    return 'overall';
  })();

  const rateDescription = `${panel1Data.volume.matching} matched, ${panel1Data.volume.pendingProcessing} pending (${rangeLabel})`;

  const averageBadgeText = dateRange?.from || dateRange?.to ? 'in-range avg' : '30-day avg';

  const metrics = [
    {
      title: "Phoenix Certificates",
      value: panel1Data.volume.totalPhoenix.toLocaleString(),
      description: "Total certificates in Phoenix system",
      icon: Database,
      badge: { text: "Live", variant: "default" as const }
    },
    {
      title: "Processed Certificates",
      value: processedValue.toLocaleString(),
      description: processedDescription,
      icon: FileText,
      badge: { text: "Evaluated", variant: "secondary" as const }
    },
    {
      title: "Processing Rate",
      value: `${panel1Data.processingCoverage.rate}%`,
      description: rateDescription,
      icon: Activity,
      badge: { 
        text: panel1Data.processingCoverage.rate > 80 ? "Good" : "Needs Attention", 
        variant: (panel1Data.processingCoverage.rate > 80 ? "default" : "destructive") as "default" | "destructive"
      }
    },
    {
      title: "Avg Daily Processed",
      value: panel1Data.dailyEvolution.summary.averageDaily.toFixed(1),
      description: "Average daily processed by Iris AI",
      icon: BarChart3,
      badge: { 
        text: averageBadgeText, 
        variant: "outline" as const 
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <div className="@xl/main:col-span-2 @5xl/main:col-span-4 flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <Switch checked={liveOnly} onCheckedChange={setLiveOnly} />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <p>On: show metrics for certificates currently present in Phoenix (Live). Off: show overall metrics.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          icon={metric.icon}
          badge={metric.badge}
          className="hover:shadow-md hover:scale-[1.02] transition-all duration-200"
        />
      ))}
    </div>
  );
} 