import { useMemo } from 'react';
import { ResultsData, ServiceResult } from '../types/results.types';

interface SourceCertificate {
  certNo?: string;
  originalFilename?: string;
  source?: string;
  timestamp?: string;
  [key: string]: any;
}

export function useResultsData(results: ResultsData) {
  const requirementsPassFlag = useMemo(() => {
    return results.summary?.requirements_pass ?? null;
  }, [results.summary?.requirements_pass]);

  const calculateRequirementsPass = useMemo(() => {
    if (!results.validate_requeirments?.evaluation_by_group) return null;
    
    const groups = results.validate_requeirments.evaluation_by_group;
    
    // Check all groups for compliance
    for (const [groupKey, groupData] of Object.entries(groups)) {
      if (groupKey === 'match_procedure' || groupKey === 'match_combination') {
        // Handle nested structure
        if (groupData && typeof groupData === 'object' && !(groupData as any).ComplianceSummary) {
          for (const [, subData] of Object.entries(groupData as Record<string, any>)) {
            if ((subData as any)?.ComplianceSummary === 'Non-compliant') {
              return false;
            }
          }
        }
      } else {
        // Handle flat structure
        if ((groupData as any)?.ComplianceSummary === 'Non-compliant') {
          return false;
        }
      }
    }
    
    return true;
  }, [results.validate_requeirments?.evaluation_by_group]);

  const formatPassFlag = (flag: boolean | string | null, serviceName: string) => {
    const serviceResult = results[serviceName as keyof ResultsData] as ServiceResult;
    if (serviceResult?.skipped) {
      // Services that should show as PASS when skipped (business rule skips)
      if (serviceResult?.templateValidated || 
          serviceResult?.equipmentTypeSkipped || 
          serviceResult?.calibrationResultSkipped ||
          serviceResult?.passed === true ||
          serviceResult?.status === 'PASS') {
        return 'PASS';
      }
      // Provide more specific reason if available, default to "No requerido"
      if ((results.source_certificate as SourceCertificate)?.source === 'upload' && serviceName === 'cmc_validate_agents') return 'PENDIENTE';
      if (serviceResult.reason?.includes('No "Not Validated" points')) return 'NO APLICA (Pre-eval)';
      if (serviceResult.reason?.includes('payload')) return 'NO DISPONIBLE (Datos)';
      return 'NO REQUERIDO';
    }
    if (flag === true) return 'PASS';
    if (flag === false) return 'FAIL';
    if (flag === null && serviceResult && !serviceResult.error) return 'PENDIENTE'; // Explicitly PENDIENTE if null but no error and not skipped
    if (serviceResult?.error) return 'ERROR';
    if (flag === null) return 'N/A'; // General N/A for other null cases
    return String(flag); // For tolerance 'PASS'/'FAIL' string values
  };

  const hasServiceData = (serviceName: string) => {
    return results[serviceName as keyof ResultsData] !== undefined && 
           results[serviceName as keyof ResultsData] !== null;
  };

  const overallStatus = results.summary?.overall_status || 'Procesando...';

  const tabs = useMemo(() => [
    { id: 'summary', name: 'Validation Summary' },
    { id: 'requirements', name: 'Requirements', dataKey: 'validate_requeirments' },
    { id: 'cmc', name: 'CMC Validation', dataKey: 'cmc_validate_agents' },
    { id: 'tolerance', name: 'Tolerance', dataKey: 'validate_tolerance' },
    { id: 'raw', name: 'Complete Data (JSON)' },
  ], []);

  return {
    requirementsPassFlag,
    calculateRequirementsPass,
    formatPassFlag,
    hasServiceData,
    overallStatus,
    tabs,
  };
} 