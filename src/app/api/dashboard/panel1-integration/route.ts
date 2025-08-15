import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server-internal';
import { phoenixApiService } from '@/lib/phoenix-api-service';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';
    
    const supabase = await createClient();
    
    // Calculate date range
    const now = new Date();
    let days = 30;
    if (timeRange === '7d') days = 7;
    if (timeRange === '90d') days = 90;
    
    const startDate = startOfDay(subDays(now, days));
    const endDate = endOfDay(now);

    // 1.1 Volume Metrics
    const phoenixCerts = await phoenixApiService.getAllCertificates();
    
    const { data: supabaseCerts, count: totalSupabase } = await supabase
      .from('evaluation_reports')
      .select('cert_no, created_at', { count: 'exact' });

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
    
    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = format(subDays(now, days - 1 - i), 'yyyy-MM-dd');
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

    // Count Supabase certificates by date
    supabaseCerts?.forEach(cert => {
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
            averageRate: Math.round(
              dailyEvolution.reduce((sum, item) => sum + item.processingRate, 0) / dailyEvolution.length * 10
            ) / 10
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