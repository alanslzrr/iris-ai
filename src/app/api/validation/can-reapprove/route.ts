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

    const supabase = await createServiceClient();

    // Get validation status
    const { data: validationRecord, error: validationError } = await supabase
      .from('validated_reports')
      .select('status, approved_at')
      .eq('cert_no', cert_no)
      .single();

    if (validationError && validationError.code !== 'PGRST116') {
      console.error('Supabase error:', validationError);
      return NextResponse.json(
        { error: 'Failed to check validation status' },
        { status: 500 }
      );
    }

    // If no validation record exists, can't re-approve
    if (!validationRecord) {
      return NextResponse.json({
        can_reapprove: false,
        reason: 'No validation record found'
      });
    }

    // If already approved, can't re-approve
    if (validationRecord.status === 'APPROVED') {
      return NextResponse.json({
        can_reapprove: false,
        reason: 'Certificate is already approved'
      });
    }

    // If not rejected, can't re-approve
    if (validationRecord.status !== 'REJECTED') {
      return NextResponse.json({
        can_reapprove: false,
        reason: 'Certificate is not in rejected status'
      });
    }

    // Get latest evaluation
    const { data: evaluationRecord, error: evaluationError } = await supabase
      .from('evaluation_reports')
      .select('created_at')
      .eq('cert_no', cert_no)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (evaluationError) {
      console.error('Supabase error (evaluation):', evaluationError);
      return NextResponse.json(
        { error: 'Failed to check evaluation status' },
        { status: 500 }
      );
    }

    if (!evaluationRecord) {
      return NextResponse.json({
        can_reapprove: false,
        reason: 'No evaluation found for this certificate'
      });
    }

    const rejectionDate = new Date(validationRecord.approved_at);
    const evaluationDate = new Date(evaluationRecord.created_at);

    const canReapprove = evaluationDate > rejectionDate;

    return NextResponse.json({
      can_reapprove: canReapprove,
      reason: canReapprove 
        ? 'A new evaluation has been generated since the previous rejection'
        : 'No newer evaluation found since rejection',
      rejection_date: validationRecord.approved_at,
      latest_evaluation_date: evaluationRecord.created_at
    });

  } catch (error) {
    console.error('Can re-approve API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
