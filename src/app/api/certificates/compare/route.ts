import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server-internal';
import { phoenixApiService } from '@/lib/phoenix-api-service';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cert_no } = await request.json();
    
    if (!cert_no) {
      return NextResponse.json(
        { success: false, error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get certificate from Supabase
    const { data: supabaseCert, error: supabaseError } = await supabase
      .from('evaluation_reports')
      .select('*')
      .eq('cert_no', cert_no)
      .single();

    if (supabaseError && supabaseError.code !== 'PGRST116') {
      throw supabaseError;
    }

    // Get certificate from Phoenix API
    const phoenixCerts = await phoenixApiService.getAllCertificates();
    const phoenixCert = phoenixCerts.find(cert => cert.CertNo === cert_no);

    const comparison = {
      cert_no,
      supabase: supabaseCert || null,
      phoenix: phoenixCert || null,
      exists_in_supabase: !!supabaseCert,
      exists_in_phoenix: !!phoenixCert,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      comparison
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 