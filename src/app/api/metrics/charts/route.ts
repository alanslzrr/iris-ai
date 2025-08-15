import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server-internal';
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
    
    // Get evaluation reports data for the time range
    const { data: evaluationReports, error } = await supabase
      .from('evaluation_reports')
      .select('cert_no, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Group data by date
    const dailyData: Record<string, { processed: number; validated: number; rejected: number; attention: number }> = {};
    
    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = format(subDays(now, days - 1 - i), 'yyyy-MM-dd');
      dailyData[date] = { processed: 0, validated: 0, rejected: 0, attention: 0 };
    }
    
    // Process evaluation reports
    evaluationReports?.forEach(report => {
      const date = format(new Date(report.created_at), 'yyyy-MM-dd');
      if (dailyData[date]) {
        dailyData[date].processed++;
        if (report.status === 'PASS') {
          dailyData[date].validated++;
        } else if (report.status === 'FAIL') {
          dailyData[date].rejected++;
        } else if (report.status === 'ATTENTION') {
          dailyData[date].attention++;
        }
      }
    });
    
    // Convert to array format for charts
    const chartData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      processed: data.processed,
      validated: data.validated,
      rejected: data.rejected,
      attention: data.attention
    }));
    
    // Calculate summary statistics
    const totalProcessed = chartData.reduce((sum, item) => sum + item.processed, 0);
    const totalValidated = chartData.reduce((sum, item) => sum + item.validated, 0);
    const validationRate = totalProcessed > 0 ? (totalValidated / totalProcessed) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary: {
          totalProcessed,
          totalValidated,
          validationRate: Math.round(validationRate * 10) / 10
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 