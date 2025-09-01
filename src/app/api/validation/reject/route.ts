import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceClient } from '@/utils/supabase/server';
import { 
  ValidationErrors,
  TOLERANCE_ERROR_CODES,
  CMC_ERROR_CODES,
  REQUIREMENTS_ERROR_CODES
} from '@/components/dashboard/report-viewer/types/validation.types';
import { phoenixApiService } from '@/lib/phoenix-api-service';

// Valid error codes for each category
const VALID_TOLERANCE_CODES = Object.values(TOLERANCE_ERROR_CODES);
const VALID_CMC_CODES = Object.values(CMC_ERROR_CODES);
const VALID_REQUIREMENTS_CODES = Object.values(REQUIREMENTS_ERROR_CODES);

interface RejectRequest {
  cert_no: string;
  CalibrationId?: string;
  comment?: string;
  tolerance_errors?: ValidationErrors;
  cmc_errors?: ValidationErrors;
  requirements_errors?: ValidationErrors;
}

function validateErrorCodes(errors: ValidationErrors | undefined, validCodes: string[], category: string): string | null {
  if (!errors) return null;
  
  // Check if codes array exists and has valid values
  if (!errors.codes || !Array.isArray(errors.codes) || errors.codes.length === 0) {
    return `${category} errors must include at least one error code`;
  }

  // Validate each code
  for (const code of errors.codes) {
    if (!validCodes.includes(code)) {
      return `Invalid ${category} error code: ${code}`;
    }
  }

  // If "another_reason" is selected, it must have a reason text
  if (errors.codes.includes('another_reason')) {
    if (!errors.another_reason || errors.another_reason.trim() === '') {
      return `${category} "another_reason" requires a description`;
    }
  }

  return null;
}

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
    const body: RejectRequest = await request.json();
    const { cert_no, CalibrationId, comment, tolerance_errors, cmc_errors, requirements_errors } = body;
    
    if (!cert_no) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Error categories are optional; if provided, they must be valid

    // Validate error codes for each category
    const toleranceValidation = validateErrorCodes(tolerance_errors, VALID_TOLERANCE_CODES, 'Tolerance');
    if (toleranceValidation) {
      return NextResponse.json({ error: toleranceValidation }, { status: 400 });
    }

    const cmcValidation = validateErrorCodes(cmc_errors, VALID_CMC_CODES, 'CMC');
    if (cmcValidation) {
      return NextResponse.json({ error: cmcValidation }, { status: 400 });
    }

    const requirementsValidation = validateErrorCodes(requirements_errors, VALID_REQUIREMENTS_CODES, 'Requirements');
    if (requirementsValidation) {
      return NextResponse.json({ error: requirementsValidation }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = await createServiceClient();

    // Resolve CalibrationId from multiple sources
    const tryResolveCalibrationId = async (): Promise<string | null> => {
      if (CalibrationId && typeof CalibrationId === 'string' && CalibrationId.trim()) return CalibrationId.trim();
      try {
        const { data: evalCalibration } = await supabase
          .from('evaluation_reports')
          .select('CalibrationId')
          .eq('cert_no', cert_no)
          .single();
        if ((evalCalibration as any)?.CalibrationId) return (evalCalibration as any).CalibrationId as string;
      } catch {}
      try {
        const { data: validated } = await supabase
          .from('validated_reports')
          .select('CalibrationId')
          .eq('cert_no', cert_no)
          .single();
        if ((validated as any)?.CalibrationId) return (validated as any).CalibrationId as string;
      } catch {}
      try {
        const details: any = await phoenixApiService.getCertificateDetails(cert_no);
        const candidates = ['CalibrationId', 'CalibrationID', 'CalibrationGuid', 'CalibrationGUID', 'ServiceItemId'];
        for (const key of candidates) {
          if (details && typeof details === 'object' && typeof (details as any)[key] === 'string' && (details as any)[key]) {
            return (details as any)[key] as string;
          }
        }
      } catch {}
      return null;
    };
    const resolvedCalibrationId = await tryResolveCalibrationId();
    if (!resolvedCalibrationId) {
      return NextResponse.json(
        { error: 'CalibrationId not found for this certificate' },
        { status: 400 }
      );
    }

    // Build Phoenix comment: use user-provided or auto-generate from evaluation json_data
    let finalComment = (comment || '').trim();
    if (!finalComment) {
      try {
        const { data: evalData } = await supabase
          .from('evaluation_reports')
          .select('json_data')
          .eq('cert_no', cert_no)
          .single();
        const json: any = (evalData as any)?.json_data || {};
        const requirements = json?.validate_requeirments || json?.validate_requirements || json?.WizardRequirements || json?.result?.WizardRequirements;
        const evalByGroup = requirements?.evaluation_by_group || json?.evaluation_by_group || json?.result?.evaluation_by_group;
        const collectReqFailures = (): { count: number; groups: Array<{ group: string; failed: any[] }> } => {
          const groups: Array<{ group: string; failed: any[] }> = [];
          let total = 0;
          if (evalByGroup && typeof evalByGroup === 'object') {
            for (const [groupKey, groupVal] of Object.entries(evalByGroup as Record<string, any>)) {
              const reqs: any[] = (groupVal as any)?.RequirementsValidation || [];
              const failed = reqs.filter(r => (r?.ValidationStatus || '').toLowerCase() === 'non-compliant');
              if (failed.length > 0) {
                total += failed.length;
                groups.push({ group: groupKey, failed });
              }
            }
          }
          return { count: total, groups };
        };
        const tol = json?.validate_tolerance || json?.result?.pipeline_results || json?.pipeline_results;
        const extractTolFailures = (): string[] => {
          const msgs: string[] = [];
          const checks: any[] = tol?.tolerance_checks || json?.result?.tolerance_checks || [];
          for (const c of checks) {
            const status = (c?.status || '').toLowerCase();
            if (status === 'fail' || status === 'failed') {
              const spec = c?.specification ? ` (spec: ${c.specification})` : '';
              const note = c?.notes ? ` — ${c.notes}` : '';
              msgs.push(`${c?.description || 'Tolerance check failed'}${spec}${note}`);
            }
          }
          return msgs;
        };
        const cmc = json?.cmc_validate_agents || json?.result?.cmc || {};
        const extractCmcFailures = (): string[] => {
          const msgs: string[] = [];
          const msg = (cmc as any)?.message || json?.message;
          if (typeof msg === 'string' && msg.trim()) msgs.push(msg.trim());
          return msgs;
        };
        const reqSummary = collectReqFailures();
        const tolMsgs = extractTolFailures();
        const cmcMsgs = extractCmcFailures();
        if (reqSummary.count > 0) {
          const top = reqSummary.groups[0];
          const firstFailed = top?.failed?.[0];
          const groupLabel = (top?.group || 'requirements').replace(/_/g, ' ');
          const notes = firstFailed?.Notes ? ` Notes: ${firstFailed.Notes}` : '';
          finalComment = `${reqSummary.count} requirement(s) failed — group: ${groupLabel}.${notes}`.trim();
        } else if (tolMsgs.length > 0) {
          finalComment = `Tolerance failures detected: ${tolMsgs[0]}`;
        } else if (cmcMsgs.length > 0) {
          finalComment = `CMC issues detected: ${cmcMsgs[0]}`;
        } else {
          finalComment = `Rejection recorded for certificate ${cert_no}`;
        }
      } catch {
        finalComment = `Rejection recorded for certificate ${cert_no}`;
      }
    }

    // Phoenix rejection must happen BEFORE any Supabase writes
    try {
      const defaultErrorListId = process.env.PHOENIX_DEFAULT_CALIBRATION_ERROR_LIST_ID || '539E936E-B396-4CAE-A44E-CB9915C37CFC';
      await phoenixApiService.rejectCalibration({
        calibrationId: resolvedCalibrationId,
        calibrationErrorListId: defaultErrorListId,
        comment: finalComment,
      });
    } catch (e: any) {
      console.error('Phoenix rejection error', { cert_no, error: String(e) });
      
      // Extract detailed error information
      let errorMessage = 'Rejection failed in Phoenix endpoint';
      let statusCode = 502;
      
      if (e.message) {
        errorMessage = e.message;
        
        // Check if it's a specific Phoenix error
        if (e.message.includes('HTTP 400')) {
          statusCode = 400;
          errorMessage = 'Phoenix rejected the rejection request. This may be because the certificate is already processed or there is an issue with the calibration data.';
        } else if (e.message.includes('HTTP 401')) {
          statusCode = 401;
          errorMessage = 'Authentication failed with Phoenix. Please check your credentials.';
        } else if (e.message.includes('HTTP 404')) {
          statusCode = 404;
          errorMessage = 'Calibration not found in Phoenix. The CalibrationId may be invalid.';
        } else if (e.message.includes('HTTP 500')) {
          statusCode = 502;
          errorMessage = 'Phoenix server error occurred during rejection.';
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

    // Prepare error objects for database (remove empty another_reason fields)
    const prepareErrorsForDB = (errors: ValidationErrors | undefined): ValidationErrors | null => {
      if (!errors) return null;
      
      const result: ValidationErrors = { codes: errors.codes };
      
      if (errors.another_reason && errors.another_reason.trim() !== '') {
        result.another_reason = errors.another_reason.trim();
      }
      
      return result;
    };

    // Update the consulted evaluation report's created_at to two years earlier
    // This ensures the external Orchestrator detects it for revalidation
    const { data: evalReport, error: fetchEvalError } = await supabase
      .from('evaluation_reports')
      .select('cert_no, created_at')
      .eq('cert_no', cert_no)
      .single();

    if (fetchEvalError) {
      console.error('Supabase fetch evaluation_report error:', fetchEvalError);
      return NextResponse.json(
        { error: 'Evaluation report not found for this certificate' },
        { status: 404 }
      );
    }

    // Subtract exactly two calendar years from the existing created_at
    const currentCreatedAt = new Date(evalReport.created_at as unknown as string);
    const updatedCreatedAt = new Date(currentCreatedAt);
    updatedCreatedAt.setFullYear(currentCreatedAt.getFullYear() - 2);

    const { error: updateEvalError } = await supabase
      .from('evaluation_reports')
      .update({ created_at: updatedCreatedAt.toISOString() })
      .eq('cert_no', cert_no)
      .single();

    if (updateEvalError) {
      console.error('Supabase update evaluation_report error:', updateEvalError);
      return NextResponse.json(
        { error: 'Failed to update evaluation report timestamp for revalidation' },
        { status: 500 }
      );
    }

    // Insert rejection record
    const { data, error } = await supabase
      .from('validated_reports')
      .insert({
        cert_no,
        status: 'REJECTED',
        approved_by: session.user.email,
        CalibrationId: resolvedCalibrationId,
        tolerance_errors: prepareErrorsForDB(tolerance_errors),
        cmc_errors: prepareErrorsForDB(cmc_errors),
        requirements_errors: prepareErrorsForDB(requirements_errors)
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save rejection record' },
        { status: 500 }
      );
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
              console.error('Webhook (decision) unsuccessful', { cert_no, status: res.status, body: text?.slice(0, 500) });
            }
          })
          .catch((err) => {
            clearTimeout(timeout);
            console.error('Webhook (decision) error', { cert_no, error: String(err) });
          });
      }
    } catch (e) {
      console.error('Webhook (decision) setup error', { cert_no, error: String(e) });
    }

    return NextResponse.json({
      success: true,
      message: 'Report rejected successfully. Feedback saved and re-evaluation has been triggered.',
      data,
      phoenix_comment: finalComment
    });

  } catch (error) {
    console.error('Rejection API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
