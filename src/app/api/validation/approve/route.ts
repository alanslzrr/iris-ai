import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/utils/supabase/server';
import { phoenixApiService } from '@/lib/phoenix-api-service';

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
    const { cert_no, CalibrationId, revision_comment, justification_comment } = await request.json();
    
    if (!cert_no) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = await createServiceClient();

    // Resolve CalibrationId from multiple sources
    let resolvedCalibrationId: string | null = null;
    const tryResolveCalibrationId = async (): Promise<string | null> => {
      // 1) Provided explicitly
      if (CalibrationId && typeof CalibrationId === 'string' && CalibrationId.trim()) return CalibrationId.trim();
      // 2) evaluation_reports
      try {
        const { data: evalReport } = await supabase
          .from('evaluation_reports')
          .select('CalibrationId')
          .eq('cert_no', cert_no)
          .single();
        if ((evalReport as any)?.CalibrationId) return (evalReport as any).CalibrationId as string;
      } catch {}
      // 3) validated_reports (historical)
      try {
        const { data: validated } = await supabase
          .from('validated_reports')
          .select('CalibrationId')
          .eq('cert_no', cert_no)
          .single();
        if ((validated as any)?.CalibrationId) return (validated as any).CalibrationId as string;
      } catch {}
      // 4) Phoenix certificate details fallback
      try {
        const details: any = await phoenixApiService.getCertificateDetails(cert_no);
        const candidates = ['CalibrationId', 'CalibrationID', 'CalibrationGuid', 'CalibrationGUID', 'ServiceItemId'];
        for (const key of candidates) {
          if (details && typeof details === 'object' && typeof details[key] === 'string' && details[key]) {
            return details[key] as string;
          }
        }
      } catch {}
      return null;
    };
    resolvedCalibrationId = await tryResolveCalibrationId();

    // Check if record already exists and if re-approval is allowed
    const { data: existingRecord } = await supabase
      .from('validated_reports')
      .select('cert_no, status, approved_at')
      .eq('cert_no', cert_no)
      .single();

    if (existingRecord) {
      // If already approved, don't allow re-approval
      if (existingRecord.status === 'APPROVED') {
        return NextResponse.json(
          { 
            error: 'This certificate has already been approved',
            existing_status: existingRecord.status 
          },
          { status: 409 }
        );
      }

      // If rejected, check if there's a newer evaluation
      if (existingRecord.status === 'REJECTED') {
        const { data: evaluationRecord } = await supabase
          .from('evaluation_reports')
          .select('created_at')
          .eq('cert_no', cert_no)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!evaluationRecord) {
          return NextResponse.json(
            { 
              error: 'No evaluation found for this certificate',
            },
            { status: 404 }
          );
        }

        const rejectionDate = new Date(existingRecord.approved_at);
        const evaluationDate = new Date(evaluationRecord.created_at);

        // Only allow re-approval if evaluation is newer than rejection
        if (evaluationDate <= rejectionDate) {
          return NextResponse.json(
            { 
              error: 'Cannot re-approve: no newer evaluation found since rejection',
              rejection_date: existingRecord.approved_at,
              latest_evaluation_date: evaluationRecord.created_at
            },
            { status: 409 }
          );
        }
      }
    }

    // Phoenix approval must happen BEFORE any Supabase writes
    try {
      const aiAnalysis = (await supabase
        .from('evaluation_reports')
        .select('openai_analysis')
        .eq('cert_no', cert_no)
        .single()).data?.openai_analysis as string | null;

      if (typeof revision_comment !== 'string' || revision_comment.trim().length === 0) {
        return NextResponse.json(
          { error: 'revisionComment is required' },
          { status: 400 }
        );
      }
      const revisionComment = revision_comment.trim();
      const justificationComment = (typeof justification_comment === 'string' && justification_comment.trim().length > 0)
        ? justification_comment.trim()
        : '';

      if (!resolvedCalibrationId) {
        return NextResponse.json(
          { error: 'CalibrationId not found for this certificate' },
          { status: 400 }
        );
      }

      await phoenixApiService.approveCalibration({
        calibrationId: resolvedCalibrationId,
        revisionComment,
        justificationComment,
        AIAnalysis: aiAnalysis || null,
      });
    } catch (e: any) {
      console.error('Phoenix approval error', { cert_no, error: String(e) });
      
      // Extract detailed error information
      let errorMessage = 'Approval failed in Phoenix endpoint';
      let statusCode = 502;
      
      // Try to extract Phoenix-specific error message
      if (e.response?.data) {
        // Phoenix returns error message in response.data
        errorMessage = e.response.data;
        statusCode = e.response.status || 400;
      } else if (e.message) {
        errorMessage = e.message;
        
        // Check if it's a specific Phoenix error
        if (e.message.includes('HTTP 400')) {
          statusCode = 400;
          // Try to extract the actual Phoenix error message from the full error
          const phoenixErrorMatch = e.message.match(/HTTP 400\): (.+)/);
          if (phoenixErrorMatch) {
            errorMessage = phoenixErrorMatch[1];
          } else {
            errorMessage = 'Phoenix rejected the approval request. This may be because the certificate is already approved or there is an issue with the calibration data.';
          }
        } else if (e.message.includes('HTTP 401')) {
          statusCode = 401;
          errorMessage = 'Authentication failed with Phoenix. Please check your credentials.';
        } else if (e.message.includes('HTTP 404')) {
          statusCode = 404;
          errorMessage = 'Calibration not found in Phoenix. The CalibrationId may be invalid.';
        } else if (e.message.includes('HTTP 500')) {
          statusCode = 502;
          errorMessage = 'Phoenix server error occurred during approval.';
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          phoenix_error: e.message || String(e),
          cert_no,
          calibration_id: resolvedCalibrationId
        },
        { status: statusCode }
      );
    }

    // Insert or update approval record (only after Phoenix succeeded)
    let data, error;
    if (existingRecord) {
      // Update existing rejected record to approved
      const result = await supabase
        .from('validated_reports')
        .update({
          status: 'APPROVED',
          approved_by: session.user.email,
          approved_at: new Date().toISOString(),
          CalibrationId: resolvedCalibrationId,
          tolerance_errors: null,
          cmc_errors: null,
          requirements_errors: null
        })
        .eq('cert_no', cert_no)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new approval record
      const result = await supabase
        .from('validated_reports')
        .insert({
          cert_no,
          status: 'APPROVED',
          approved_by: session.user.email,
          CalibrationId: resolvedCalibrationId,
          tolerance_errors: null,
          cmc_errors: null,
          requirements_errors: null
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save approval record' },
        { status: 500 }
      );
    }

    // Ensure evaluation_reports also stores CalibrationId (when available)
    if (resolvedCalibrationId) {
      try {
        await supabase
          .from('evaluation_reports')
          .update({ CalibrationId: resolvedCalibrationId })
          .eq('cert_no', cert_no);
      } catch (e) {
        console.error('Failed to persist CalibrationId in evaluation_reports', { cert_no, error: String(e) });
      }
    }

    // Fire-and-forget webhook notification (non-blocking)
    try {
      const enabled = process.env.WEBHOOK_VALIDATION_ENABLED === 'true';
      const webhookUrl = process.env.WEBHOOK_VALIDATION_URL;
      const reportBaseUrl = process.env.REPORT_VIEW_BASE_URL || 'https://certificate-report-339343666693.us-central1.run.app';

      if (enabled && webhookUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const payload = {
          cert_no,
          user: session.user.email,
          timestamp: (data as any)?.approved_at || new Date().toISOString(),
          report_url: `${reportBaseUrl}/certificates/${encodeURIComponent(cert_no)}/view`,
        };

        // Do not await; log any errors internally
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
          .then(async (res) => {
            clearTimeout(timeout);
            if (!res.ok) {
              const text = await res.text().catch(() => '');
              console.error('Webhook (approval) unsuccessful', { cert_no, status: res.status, body: text?.slice(0, 500) });
            }
          })
          .catch((err) => {
            clearTimeout(timeout);
            console.error('Webhook (approval) error', { cert_no, error: String(err) });
          });
      }
    } catch (e) {
      console.error('Webhook (approval) setup error', { cert_no, error: String(e) });
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
