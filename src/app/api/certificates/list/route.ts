import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Optional query parameters
    const all = searchParams.get('all') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('evaluation_reports')
      .select(`
        cert_no,
        created_at,
        overall_status,
        tolerance_pass,
        requirements_pass,
        cmc_pass,
        openai_summary,
        manufacturer,
        model,
        equipment_type,
        customer_name,
        calibrated_by
      `)
      .order('created_at', { ascending: false });

    if (!all) {
      query = query.range(offset, offset + limit - 1);
    }

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('overall_status', status);
    }

    if (search) {
      query = query.or(`
        cert_no.ilike.%${search}%,
        manufacturer.ilike.%${search}%,
        model.ilike.%${search}%,
        customer_name.ilike.%${search}%
      `);
    }

    const { data: certificates, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch certificates' 
        },
        { status: 500 }
      );
    }

    // Derive ATTENTION status for tolerance CANNOT_VERIFY
    const transformed = (certificates || []).map((c: any) => {
      const derivedStatus = c?.tolerance_pass === 'CANNOT_VERIFY' ? 'ATTENTION' : c?.overall_status;
      const serviceStatuses = {
        requirements: c?.requirements_pass as boolean | null | undefined,
        cmc: c?.cmc_pass as boolean | null | undefined,
        tolerance: c?.tolerance_pass as string | null | undefined,
      };
      const openaiServices = [
        serviceStatuses.requirements !== undefined ? 'validate_requeirments' : null,
        serviceStatuses.cmc !== undefined ? 'cmc_validate_agents' : null,
        serviceStatuses.tolerance !== undefined ? 'validate_tolerance' : null,
      ].filter(Boolean);
      return {
        cert_no: c.cert_no,
        created_at: c.created_at,
        overall_status: derivedStatus,
        requirements_pass: c.requirements_pass ?? null,
        cmc_pass: c.cmc_pass ?? null,
        tolerance_pass: c.tolerance_pass ?? null,
        openai_summary: c.openai_summary ?? null,
        openai_services: openaiServices,
        manufacturer: c.manufacturer,
        model: c.model,
        equipment_type: c.equipment_type,
        customer_name: c.customer_name,
        calibrated_by: c.calibrated_by,
      };
    });

    return NextResponse.json({
      success: true,
      certificates: transformed,
      total: count || 0,
      limit: all ? undefined : limit,
      offset: all ? undefined : offset
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