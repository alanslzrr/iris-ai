import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cert_no = searchParams.get('cert_no');
    
    if (!cert_no) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = await createServiceClient();

    // Get validation status
    const { data, error } = await supabase
      .from('validated_reports')
      .select('*')
      .eq('cert_no', cert_no)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to check validation status' },
        { status: 500 }
      );
    }

    // Return status
    if (data) {
      return NextResponse.json({
        validated: true,
        status: data.status,
        approved_by: data.approved_by,
        approved_at: data.approved_at,
        tolerance_errors: data.tolerance_errors,
        cmc_errors: data.cmc_errors,
        requirements_errors: data.requirements_errors,
        client_feedback: (data as any)?.client_feedback ?? null
      });
    } else {
      return NextResponse.json({
        validated: false,
        status: null
      });
    }

  } catch (error) {
    console.error('Status check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
