import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server-internal';
import { phoenixApiService } from '@/lib/phoenix-api-service';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';
    const liveParam = searchParams.get('live');
    const liveOnly = liveParam === '1' || liveParam === 'true';
    
    const supabase = await createClient();
    
    // Calculate date range
    const now = new Date();
    let days = 30;
    if (timeRange === '7d') days = 7;
    if (timeRange === '90d') days = 90;
    
    const startDate = startOfDay(subDays(now, days));
    const endDate = endOfDay(now);

    // Get all evaluation reports for the time range
    const { data: evaluationReports, error } = await supabase
      .from('evaluation_reports')
      .select(`
        cert_no, 
        created_at, 
        overall_status, 
        tolerance_pass, 
        requirements_pass, 
        cmc_pass, 
        equipment_type
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    let reports = evaluationReports || [];

    // Optional: filter to Live certificates only (present in Phoenix)
    if (liveOnly) {
      const phoenixCerts = await phoenixApiService.getAllCertificates();
      const normalize = (s: string) => (s || '').toString().trim().toUpperCase();
      const liveSet = new Set<string>(phoenixCerts.map(c => normalize((c as any).CertNo)));
      reports = reports.filter(r => liveSet.has(normalize(r.cert_no)));
    }

    // 2.1 Status Distribution
    const statusCounts = reports.reduce((acc: Record<string, number>, report) => {
      const status = report.overall_status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: status === 'PASS' ? 'hsl(45, 100%, 51%)' : 
             status === 'FAIL' ? 'hsl(0, 100%, 50%)' : 
             status === 'ATTENTION' ? 'hsl(30, 100%, 50%)' : 'hsl(0, 0%, 50%)'
    }));

    // 2.2 Key Indicators
    const totalEvaluated = reports.length;
    const failCount = statusCounts['FAIL'] || 0;
    const attentionCount = statusCounts['ATTENTION'] || 0;
    
    const keyIndicators = {
      totalEvaluated,
      failRate: totalEvaluated > 0 ? Math.round((failCount / totalEvaluated) * 1000) / 10 : 0,
      attentionRate: totalEvaluated > 0 ? Math.round((attentionCount / totalEvaluated) * 1000) / 10 : 0
    };

    // 2.3 Processing Timeline
    const dailyData: Record<string, { PASS: number; FAIL: number; ATTENTION: number; UNKNOWN: number }> = {};
    
    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = format(subDays(now, days - 1 - i), 'yyyy-MM-dd');
      dailyData[date] = { PASS: 0, FAIL: 0, ATTENTION: 0, UNKNOWN: 0 };
    }

    // Count reports by date and status
    reports.forEach(report => {
      const date = format(new Date(report.created_at), 'yyyy-MM-dd');
      const status = report.overall_status || 'UNKNOWN';
      if (dailyData[date] && status in dailyData[date]) {
        dailyData[date][status as keyof typeof dailyData[typeof date]]++;
      }
    });

    const processingTimeline = Object.entries(dailyData).map(([date, data]) => ({
      date,
      PASS: data.PASS,
      FAIL: data.FAIL,
      ATTENTION: data.ATTENTION,
      UNKNOWN: data.UNKNOWN
    }));

    // 2.4 Breakdown by validation criteria
    const criteriaBreakdown = {
      tolerance: {
        PASS: reports.filter(r => r.tolerance_pass === 'PASS').length,
        FAIL: reports.filter(r => r.tolerance_pass === 'FAIL').length,
        UNKNOWN: reports.filter(r => !r.tolerance_pass || r.tolerance_pass === 'UNKNOWN').length
      },
      requirements: {
        PASS: reports.filter(r => r.requirements_pass === true).length,
        FAIL: reports.filter(r => r.requirements_pass === false).length,
        UNKNOWN: reports.filter(r => r.requirements_pass === null || r.requirements_pass === undefined).length
      },
      cmc: {
        PASS: reports.filter(r => r.cmc_pass === true).length,
        FAIL: reports.filter(r => r.cmc_pass === false).length,
        UNKNOWN: reports.filter(r => r.cmc_pass === null || r.cmc_pass === undefined).length
      }
    };

    // 2.5 Performance by Equipment Type
    const equipmentTypeData: Record<string, { PASS: number; FAIL: number; ATTENTION: number; UNKNOWN: number }> = {};
    
    reports.forEach(report => {
      const equipmentType = report.equipment_type || 'Unknown';
      if (!equipmentTypeData[equipmentType]) {
        equipmentTypeData[equipmentType] = { PASS: 0, FAIL: 0, ATTENTION: 0, UNKNOWN: 0 };
      }
      
      const status = report.overall_status || 'UNKNOWN';
      if (status in equipmentTypeData[equipmentType]) {
        equipmentTypeData[equipmentType][status as keyof typeof equipmentTypeData[typeof equipmentType]]++;
      }
    });

    const equipmentTypePerformance = Object.entries(equipmentTypeData).map(([type, data]) => ({
      equipmentType: type,
      PASS: data.PASS,
      FAIL: data.FAIL,
      ATTENTION: data.ATTENTION,
      UNKNOWN: data.UNKNOWN,
      total: data.PASS + data.FAIL + data.ATTENTION + data.UNKNOWN
    })).sort((a, b) => b.total - a.total); // Sort by total count descending

    return NextResponse.json({
      success: true,
      data: {
        // 2.1 Status Distribution
        statusDistribution: {
          chartData: statusDistribution,
          summary: statusCounts
        },
        
        // 2.2 Key Indicators
        keyIndicators,
        
        // 2.3 Processing Timeline
        processingTimeline: {
          chartData: processingTimeline,
          summary: {
            totalProcessed: totalEvaluated,
            averageDaily: Math.round(totalEvaluated / days * 10) / 10
          }
        },
        
        // 2.4 Validation Criteria Breakdown
        validationCriteria: {
          tolerance: criteriaBreakdown.tolerance,
          requirements: criteriaBreakdown.requirements,
          cmc: criteriaBreakdown.cmc
        },
        
        // 2.5 Equipment Type Performance
        equipmentTypePerformance: {
          chartData: equipmentTypePerformance,
          summary: {
            totalTypes: equipmentTypePerformance.length,
            topType: equipmentTypePerformance[0]?.equipmentType || 'N/A'
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Panel 2 API Error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 