import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certNo: string }> }
) {
  try {
    const { certNo: rawCertNo } = await params;
    const certNo = decodeURIComponent(rawCertNo);
    const supabase = await createClient();

    // Fetch the specific certificate and its json_data
    const { data: certificate, error } = await supabase
      .from('evaluation_reports')
      .select('*')
      .eq('cert_no', certNo)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Certificate not found' 
        },
        { status: 404 }
      );
    }

    if (!certificate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Certificate not found' 
        },
        { status: 404 }
      );
    }

    // Check if json_data exists and is valid
    if (!certificate.json_data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No validation results available for this certificate' 
        },
        { status: 404 }
      );
    }

    // Parse json_data if it's a string
    let parsedJsonData;
    try {
      parsedJsonData = typeof certificate.json_data === 'string' 
        ? JSON.parse(certificate.json_data) 
        : certificate.json_data;
    } catch (parseError) {
      console.error('Error parsing json_data:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid validation data format' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      json_data: parsedJsonData,
      certificate_info: {
        cert_no: certificate.cert_no,
        created_at: certificate.created_at,
        overall_status: certificate.overall_status,
        manufacturer: certificate.manufacturer,
        model: certificate.model,
        equipment_type: certificate.equipment_type,
        customer_name: certificate.customer_name,
        report_url: certificate.report_url ?? null
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}