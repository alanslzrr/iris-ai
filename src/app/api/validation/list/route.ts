import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Require authentication for listing validations/activity
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // e.g. APPROVED | REJECTED | null
    const search = searchParams.get('search');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    const page = Math.max(1, Number(pageParam || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeParam || '25')));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = await createServiceClient();

    let query = supabase
      .from('validated_reports')
      .select('*', { count: 'exact' })
      .order('approved_at', { ascending: false });

    if (status && (status === 'APPROVED' || status === 'REJECTED')) {
      query = query.eq('status', status);
    }

    if (search && search.trim() !== '') {
      // Filter by cert_no or approved_by (case-insensitive)
      const term = `%${search.trim()}%`;
      query = query.or(
        `cert_no.ilike.${term},approved_by.ilike.${term}`
      );
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error (validated_reports list):', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch validated reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      records: data || [],
      count: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Validated list API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


