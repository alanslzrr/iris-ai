"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    summary: {averageRate: number};
  };
}

export function ModernMetricsCards() {
  const [panel1Data, setPanel1Data] = useState<Panel1Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPanel1Data = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/panel1-integration?range=30d');
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
  }, []);

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
      value: panel1Data.volume.totalSupabase.toLocaleString(),
      description: "Certificates processed in Supabase",
      icon: FileText,
      badge: { text: "Evaluated", variant: "secondary" as const }
    },
    {
      title: "Processing Rate",
      value: `${panel1Data.processingCoverage.rate}%`,
      description: `${panel1Data.volume.matching} matched, ${panel1Data.volume.pendingProcessing} pending`,
      icon: Activity,
      badge: { 
        text: panel1Data.processingCoverage.rate > 80 ? "Good" : "Needs Attention", 
        variant: (panel1Data.processingCoverage.rate > 80 ? "default" : "destructive") as "default" | "destructive"
      }
    },
    {
      title: "Average Daily Rate",
      value: `${panel1Data.dailyEvolution.summary.averageRate}%`,
      description: "Average daily processing coverage",
      icon: BarChart3,
      badge: { 
        text: "30-day avg", 
        variant: "outline" as const 
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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