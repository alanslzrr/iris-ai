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

// Valid error codes for each category
const VALID_TOLERANCE_CODES = Object.values(TOLERANCE_ERROR_CODES);
const VALID_CMC_CODES = Object.values(CMC_ERROR_CODES);
const VALID_REQUIREMENTS_CODES = Object.values(REQUIREMENTS_ERROR_CODES);

interface RejectRequest {
  cert_no: string;
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
    const { cert_no, tolerance_errors, cmc_errors, requirements_errors } = body;
    
    if (!cert_no) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Validate that at least one error category is provided
    if (!tolerance_errors && !cmc_errors && !requirements_errors) {
      return NextResponse.json(
        { error: 'At least one error category must be specified for rejection' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: 'Report rejected successfully. Feedback saved and re-evaluation has been triggered.',
      data
    });

  } catch (error) {
    console.error('Rejection API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
