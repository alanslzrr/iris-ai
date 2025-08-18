import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server-internal';
import { phoenixApiService } from '@/lib/phoenix-api-service';
import { format, subDays, startOfDay, endOfDay, addDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    const supabase = await createClient();
    
    // Calculate date range
    const now = new Date();
    let days = 30;
    if (timeRange === '7d') days = 7;
    if (timeRange === '90d') days = 90;

    let startDate = startOfDay(subDays(now, days));
    let endDate = endOfDay(now);

    if (fromParam || toParam) {
      const from = fromParam ? new Date(fromParam) : null;
      const to = toParam ? new Date(toParam) : null;
      if (from && !isNaN(from.getTime())) startDate = startOfDay(from);
      if (to && !isNaN(to.getTime())) endDate = endOfDay(to);
    }

    // 1.1 Volume Metrics
    const phoenixCerts = await phoenixApiService.getAllCertificates();
    const hasValidDates = phoenixCerts.some(cert => {
      if (!cert.LastModified) return false;
      const d = new Date(cert.LastModified);
      return !isNaN(d.getTime());
    });
    const phoenixCertsInRange = hasValidDates
      ? phoenixCerts.filter(cert => {
          if (!cert.LastModified) return false;
          const d = new Date(cert.LastModified);
          if (isNaN(d.getTime())) return false;
          return d >= startDate && d <= endDate;
        })
      : phoenixCerts;
    
    // Supabase certificates (all-time) for coverage metrics
    const { data: supabaseCerts } = await supabase
      .from('evaluation_reports')
      .select('cert_no, created_at');

    // Supabase certificates within the selected time range for daily averages
    const { data: supabaseCertsInRange } = await supabase
      .from('evaluation_reports')
      .select('cert_no, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Use all-time data for overall coverage metrics to avoid zeros from date filtering
    const coverage = phoenixApiService.calculateProcessingCoverage(phoenixCerts, supabaseCerts || []);

    // 1.2 Processing Coverage Chart Data
    const processedVsPending = [
      {
        category: 'Processed',
        value: coverage.matching,
        color: 'hsl(45, 100%, 51%)' // brand-yellow
      },
      {
        category: 'Pending',
        value: coverage.pendingProcessing,
        color: 'hsl(30, 100%, 50%)' // brand-orange
      }
    ];

    // 1.3 Daily Coverage Evolution
    const dailyData: Record<string, { phoenixCount: number; supabaseCount: number; rate: number }> = {};
    
    // Initialize all dates in selected range
    const effectiveDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    for (let i = 0; i < effectiveDays; i++) {
      const date = format(addDays(startDate, i), 'yyyy-MM-dd');
      dailyData[date] = { phoenixCount: 0, supabaseCount: 0, rate: 0 };
    }

    // Count Phoenix certificates by date (using LastModified as proxy for creation date)
    phoenixCerts.forEach(cert => {
      if (cert.LastModified) {
        const date = format(new Date(cert.LastModified), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].phoenixCount++;
        }
      }
    });

    // Count Supabase certificates by date (only within selected range)
    supabaseCertsInRange?.forEach(cert => {
      if (cert.created_at) {
        const date = format(new Date(cert.created_at), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].supabaseCount++;
        }
      }
    });

    // Calculate daily processing rates
    Object.keys(dailyData).forEach(date => {
      const data = dailyData[date];
      data.rate = data.phoenixCount > 0 ? (data.supabaseCount / data.phoenixCount) * 100 : 0;
    });

    const dailyEvolution = Object.entries(dailyData).map(([date, data]) => ({
      date,
      phoenixCount: data.phoenixCount,
      supabaseCount: data.supabaseCount,
      processingRate: Math.round(data.rate * 10) / 10
    }));

    // Calculate Supabase-only average daily processed for the selected range
    const totalEvaluatedInRange = (supabaseCertsInRange?.length || 0);
    const averageDailyProcessed = Math.round((totalEvaluatedInRange / effectiveDays) * 10) / 10;

    return NextResponse.json({
      success: true,
      data: {
        // 1.1 Volume KPIs
        volume: {
          totalPhoenix: coverage.totalPhoenix,
          totalSupabase: coverage.totalSupabase,
          matching: coverage.matching,
          pendingProcessing: coverage.pendingProcessing
        },
        
        // 1.2 Processing Coverage
        processingCoverage: {
          rate: Math.round(coverage.processingRate * 10) / 10,
          chartData: processedVsPending
        },
        
        // 1.3 Daily Coverage Evolution
        dailyEvolution: {
          chartData: dailyEvolution,
          summary: {
            // Supabase-only metric to align with Analytics
            averageDaily: averageDailyProcessed
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Panel 1 API Error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 