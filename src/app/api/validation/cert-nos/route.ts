import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional: APPROVED | REJECTED

    const supabase = await createServiceClient();
    let query = supabase
      .from('validated_reports')
      .select('cert_no');

    if (status && (status === 'APPROVED' || status === 'REJECTED')) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase error (validated cert_nos):', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch validated certificate numbers' },
        { status: 500 }
      );
    }

    const certNos = (data || []).map((row: { cert_no: string }) => row.cert_no);
    return NextResponse.json({ success: true, certNos });
  } catch (error) {
    console.error('Validated cert-nos API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


