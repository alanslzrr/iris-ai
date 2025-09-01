export interface ValidationRecord {
  cert_no: string;
  status: 'APPROVED' | 'REJECTED';
  approved_by: string;
  approved_at: string;
  tolerance_errors?: ValidationErrors | null;
  cmc_errors?: ValidationErrors | null;
  requirements_errors?: ValidationErrors | null;
  client_feedback?: string | null;
}

export interface ValidationErrors {
  codes: string[];
  another_reason?: string;
}

export interface ToleranceErrorCodes {
  ERROR_PDF_EXTRACTION: 'error_pdf_extraction';
  TOLERANCE_APPLIED_FAIL: 'Tolerance_applied_fail';
  SPEC_TOLERANCE_APPLIED_FAIL: 'spec_tolerance_applied_fail';
  UNIT_CONVERSION_FAIL: 'unit_conversion_fail';
  ANOTHER_REASON: 'another_reason';
}

export interface CmcErrorCodes {
  ERROR_PDF_EXTRACTION: 'error_pdf_extraction';
  MATCH_EQUIPMENT_FAIL: 'match_equipment_fail';
  MATCH_PARAMETER_FAIL: 'match_parameter_fail';
  UNIT_CONVERSION_FAIL: 'unit_conversion_fail';
  ANOTHER_REASON: 'another_reason';
}

export interface RequirementsErrorCodes {
  ERROR_PDF_EXTRACTION: 'error_pdf_extraction';
  UNIT_CONVERSION_FAIL: 'unit_conversion_fail';
  TRACEABILITY_FAIL: 'traceability_fail';
  MATCH_GROUP_REQUIREMENT_FAILED: 'match_group_requeirment_failed';
  MAPPING_REQUIREMENTS_FAIL: 'mapping_requeirments_fail';
  COMPLIANT_REQUIREMENT_FAIL: 'compliant_requeirment_fail';
  WRONG_JUSTIFICATION: 'wrong_justification';
  ANOTHER_REASON: 'another_reason';
}

export const TOLERANCE_ERROR_CODES: Record<string, string> = {
  ERROR_PDF_EXTRACTION: 'error_pdf_extraction',
  TOLERANCE_APPLIED_FAIL: 'Tolerance_applied_fail',
  SPEC_TOLERANCE_APPLIED_FAIL: 'spec_tolerance_applied_fail',
  UNIT_CONVERSION_FAIL: 'unit_conversion_fail',
  ANOTHER_REASON: 'another_reason',
};

export const CMC_ERROR_CODES: Record<string, string> = {
  ERROR_PDF_EXTRACTION: 'error_pdf_extraction',
  MATCH_EQUIPMENT_FAIL: 'match_equipment_fail',
  MATCH_PARAMETER_FAIL: 'match_parameter_fail',
  UNIT_CONVERSION_FAIL: 'unit_conversion_fail',
  ANOTHER_REASON: 'another_reason',
};

export const REQUIREMENTS_ERROR_CODES: Record<string, string> = {
  ERROR_PDF_EXTRACTION: 'error_pdf_extraction',
  UNIT_CONVERSION_FAIL: 'unit_conversion_fail',
  TRACEABILITY_FAIL: 'traceability_fail',
  MATCH_GROUP_REQUIREMENT_FAILED: 'match_group_requeirment_failed',
  MAPPING_REQUIREMENTS_FAIL: 'mapping_requeirments_fail',
  COMPLIANT_REQUIREMENT_FAIL: 'compliant_requeirment_fail',
  WRONG_JUSTIFICATION: 'wrong_justification',
  ANOTHER_REASON: 'another_reason',
};

export const TOLERANCE_ERROR_LABELS: Record<string, string> = {
  [TOLERANCE_ERROR_CODES.ERROR_PDF_EXTRACTION]: 'Error in PDF extraction',
  [TOLERANCE_ERROR_CODES.TOLERANCE_APPLIED_FAIL]: 'Tolerance application failed',
  [TOLERANCE_ERROR_CODES.SPEC_TOLERANCE_APPLIED_FAIL]: 'Specification tolerance applied failed',
  [TOLERANCE_ERROR_CODES.UNIT_CONVERSION_FAIL]: 'Unit conversion failed',
  [TOLERANCE_ERROR_CODES.ANOTHER_REASON]: 'Other reason (specify below)',
};

export const CMC_ERROR_LABELS: Record<string, string> = {
  [CMC_ERROR_CODES.ERROR_PDF_EXTRACTION]: 'Error in PDF extraction',
  [CMC_ERROR_CODES.MATCH_EQUIPMENT_FAIL]: 'Equipment matching failed',
  [CMC_ERROR_CODES.MATCH_PARAMETER_FAIL]: 'Parameter matching failed',
  [CMC_ERROR_CODES.UNIT_CONVERSION_FAIL]: 'Unit conversion failed',
  [CMC_ERROR_CODES.ANOTHER_REASON]: 'Other reason (specify below)',
};

export const REQUIREMENTS_ERROR_LABELS: Record<string, string> = {
  [REQUIREMENTS_ERROR_CODES.ERROR_PDF_EXTRACTION]: 'Error in PDF extraction',
  [REQUIREMENTS_ERROR_CODES.UNIT_CONVERSION_FAIL]: 'Unit conversion failed',
  [REQUIREMENTS_ERROR_CODES.TRACEABILITY_FAIL]: 'Traceability failed',
  [REQUIREMENTS_ERROR_CODES.MATCH_GROUP_REQUIREMENT_FAILED]: 'Match group requirement failed',
  [REQUIREMENTS_ERROR_CODES.MAPPING_REQUIREMENTS_FAIL]: 'Mapping requirements failed',
  [REQUIREMENTS_ERROR_CODES.COMPLIANT_REQUIREMENT_FAIL]: 'Compliant requirement failed',
  [REQUIREMENTS_ERROR_CODES.WRONG_JUSTIFICATION]: 'Wrong justification',
  [REQUIREMENTS_ERROR_CODES.ANOTHER_REASON]: 'Other reason (specify below)',
};

export interface RejectFormData {
  tolerance_errors: {
    codes: string[];
    another_reason: string;
  };
  cmc_errors: {
    codes: string[];
    another_reason: string;
  };
  requirements_errors: {
    codes: string[];
    another_reason: string;
  };
  comment?: string;
}
