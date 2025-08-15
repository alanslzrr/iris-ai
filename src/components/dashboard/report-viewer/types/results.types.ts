export interface ResultsData {
  summary?: {
    overall_status?: string;
    requirements_pass?: boolean;
    cmc_pass?: boolean;
    tolerance_pass?: string;
  };
  validate_requeirments?: ServiceResult;
  cmc_validate_agents?: ServiceResult;
  validate_tolerance?: ServiceResult;
  source_certificate?: {
    certNo?: string;
    originalFilename?: string;
    source?: string;
    timestamp?: string;
  };
  evaluation_status?: 'validated' | 'overwritten' | 'not_checked';
  initial_json_payload?: any;
  initial_pdf_payload_base64?: string;
  openai_analysis?: {
    summary?: string;
    analysis?: string;
    error?: string;
  };
}

export interface ServiceResult {
  skipped?: boolean;
  error?: string;
  status?: string;
  reason?: string;
  templateValidated?: boolean;
  equipmentTypeSkipped?: boolean;
  calibrationResultSkipped?: boolean;
  passed?: boolean;
  serviceNameKey?: string;
  details?: any;
  pdf_analysis?: {
    compliance_analyses?: Array<{
      measurements?: any[];
    }>;
    message?: string;
  };
  gemini_analysis?: {
    VERIDICT?: {
      Assessment?: string;
      Confidence?: string;
      Rationale?: string;
    };
  };
  cmcTotal?: number;
  inputSource?: string;
  // Direct structure for requirements (not nested under result)
  evaluation_by_group?: Record<string, any>;
  WizardRequirements?: Record<string, any>;
  overall_verdict?: string;
  message?: string;
  // Tolerance pipeline results - NEW structure (direct access)
  pipeline_results?: any;
  // Legacy result structure for backwards compatibility
  result?: {
    WizardRequirements?: Record<string, any>;
    evaluation_by_group?: Record<string, any>;
    pipeline_results?: any;
    // Legacy tolerance structure
    total_count?: number;
    passed_count?: number;
    failed_count?: number;
    overall_pass?: boolean;
    tolerance_checks?: Array<{
      description?: string;
      status?: string;
      measured_value?: string;
      unit?: string;
      tolerance_min?: string;
      tolerance_max?: string;
      specification?: string;
      notes?: string;
    }>;
  };
}

export interface RequirementValidation {
  Requirement: string;
  ValidationStatus: 'Compliant' | 'Non-compliant' | 'Warning';
  EvaluationMethod: string;
  FieldsUtilized: string;
  Notes?: string;
  CreatedBy?: string;
  CreatedAt?: string;
  UpdatedBy?: string;
  UpdatedAt?: string;
}

export interface RequirementsGroup {
  RequirementsValidation: RequirementValidation[];
  MatchFields?: Record<string, any>;
  ComplianceSummary?: string;
}

export interface ServiceCardProps {
  title: string;
  status: string;
  passFlag: boolean | string | null;
  serviceName: string;
  results: ResultsData;
}

export interface StatusIndicatorProps {
  status: string;
  isSkipped?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface TabItem {
  id: string;
  name: string;
  dataKey?: string;
}

export interface ServiceDetailLayoutProps {
  serviceName: string;
  serviceData: ServiceResult | undefined;
  passFlag: boolean | string | null;
  getServiceStatusIcon: (serviceName: string, passFlag: boolean | string | null) => React.ReactNode;
  children?: React.ReactNode;
} 