import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server-internal';

export async function GET() {
  try {
    // For now, we'll return all certificates since report_reviews table might not exist yet
    // When you implement the report_reviews table, uncomment the commented code below
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('evaluation_reports')
      .select('cert_no, customer_name, equipment_type, overall_status, created_at, calibrated_by, manufacturer, model')
      .order('created_at', { ascending: false });

    // When you have the report_reviews table implemented, use this instead:
    // const { data, error } = await supabase
    //   .from('evaluation_reports')
    //   .select('cert_no, customer_name, equipment_type, overall_status, created_at, calibrated_by, manufacturer, model')
    //   .not('cert_no', 'in', `(SELECT cert_no FROM report_reviews)`)
    //   .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, certificates: data || [] });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error fetching pending review certificates:', err);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 