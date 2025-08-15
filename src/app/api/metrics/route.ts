import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server-internal';
import { phoenixApiService } from '@/lib/phoenix-api-service';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Optimized: Get all evaluation reports data in a single query
    const { data: evaluationReports, count: totalProcessed } = await supabase
      .from('evaluation_reports')
      .select('cert_no, status', { count: 'exact' });

    // Certificados en Phoenix
    const phoenixCerts = await phoenixApiService.getAllCertificates();
    const phoenixCount = phoenixCerts.length;

    // Process data from single query
    const supabaseCertNos = new Set(evaluationReports?.map(cert => cert.cert_no) || []);
    const pendingTechnical = phoenixCerts.filter(cert => !supabaseCertNos.has(cert.CertNo)).length;

    // Status breakdown from the same data
    const statusCounts = evaluationReports?.reduce((acc: Record<string, number>, cert: { status: string }) => {
      acc[cert.status] = (acc[cert.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      metrics: {
        totalProcessed: totalProcessed || 0,
        pendingReview: 0, // Will be updated when report_reviews table is implemented
        validated: 0, // Will be updated when report_reviews table is implemented
        rejected: 0, // Will be updated when report_reviews table is implemented
        phoenixCount,
        pendingTechnical,
        statusBreakdown: statusCounts
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