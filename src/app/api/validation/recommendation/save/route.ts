import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { cert_no, client_feedback } = await request.json();
    if (!cert_no || typeof client_feedback !== 'string') {
      return NextResponse.json({ error: 'cert_no and client_feedback are required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: existingRecord, error: fetchErr } = await supabase
      .from('validated_reports')
      .select('cert_no, status, client_feedback, approved_by, approved_at, tolerance_errors, cmc_errors, requirements_errors')
      .eq('cert_no', cert_no)
      .single();

    if (fetchErr || !existingRecord) {
      return NextResponse.json({ error: 'Validation record not found' }, { status: 404 });
    }

    if (existingRecord.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Recommendation can only be saved for approved reports' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('validated_reports')
      .update({ client_feedback })
      .eq('cert_no', cert_no)
      .select()
      .single();

    if (error) {
      console.error('Supabase error (save recommendation):', error);
      return NextResponse.json({ error: 'Failed to save recommendation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save recommendation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


