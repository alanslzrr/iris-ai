import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { cert_no } = await request.json();
    
    if (!cert_no) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = await createServiceClient();

    // Check if record already exists
    const { data: existingRecord } = await supabase
      .from('validated_reports')
      .select('cert_no, status')
      .eq('cert_no', cert_no)
      .single();

    if (existingRecord) {
      return NextResponse.json(
        { 
          error: 'This certificate has already been validated',
          existing_status: existingRecord.status 
        },
        { status: 409 }
      );
    }

    // Insert approval record
    const { data, error } = await supabase
      .from('validated_reports')
      .insert({
        cert_no,
        status: 'APPROVED',
        approved_by: session.user.email,
        tolerance_errors: null,
        cmc_errors: null,
        requirements_errors: null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save approval record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report approved successfully',
      data
    });

  } catch (error) {
    console.error('Approval API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
