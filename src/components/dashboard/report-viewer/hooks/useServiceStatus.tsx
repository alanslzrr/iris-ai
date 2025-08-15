import { CheckCircle, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { ResultsData, ServiceResult } from '../types/results.types';

export function useServiceStatus(results: ResultsData) {
  const getStatusColor = (status: string, isSkipped: boolean = false) => {
    // Neutral background for all statuses; color is expressed by the icon, not the chip bg
    return isSkipped ? 'bg-muted text-muted-foreground' : 'bg-muted text-foreground';
  };

  const getStatusIcon = (status: string, isSkipped: boolean = false) => {
    if (isSkipped) return <HelpCircle className="h-5 w-5 text-muted-foreground opacity-60" />;
    const colorByStatus: Record<string, string> = {
  PASS: 'text-emerald-600 dark:text-emerald-400',
  FAIL: 'text-destructive',
  ATTENTION: 'text-amber-600 dark:text-amber-400',
  PROCESSING: 'text-sky-600 dark:text-sky-400',
  PENDING: 'text-sky-600 dark:text-sky-400',
    };
    const colorClass = colorByStatus[status] || 'text-blue-600 dark:text-blue-400';
    if (status === 'PASS') return <CheckCircle className={`h-5 w-5 ${colorClass}`} />;
    if (status === 'FAIL') return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />;
    if (status === 'ATTENTION') return <Clock className={`h-5 w-5 ${colorClass}`} />;
    return <Clock className={`h-5 w-5 ${colorClass}`} />;
  };

  const getServiceStatusIcon = (serviceName: string, passFlag: boolean | string | null) => {
    const serviceResult = results[serviceName as keyof ResultsData] as ServiceResult;
    const correctedKeyMap = {
      'validate_requeirments': 'requirements_pass',
      'cmc_validate_agents': 'cmc_pass',
      'validate_tolerance': 'tolerance_pass'
    };

    const summaryStatus = serviceName === 'validate_requeirments' 
      ? passFlag  // Use calculated value for requirements
      : results.summary?.[correctedKeyMap[serviceName as keyof typeof correctedKeyMap] as keyof typeof results.summary];

    if (serviceResult?.skipped) {
      // Services that should show as successful when skipped
      if (
        serviceResult?.templateValidated ||
        serviceResult?.equipmentTypeSkipped ||
        serviceResult?.calibrationResultSkipped ||
        serviceResult?.passed === true ||
        serviceResult?.status === 'PASS'
      ) {
    return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      }
      // Neutral for generic skipped
      return <HelpCircle className="h-5 w-5 text-muted-foreground opacity-60" />;
    }
    
    // Check passFlag from summary for services like tolerance that use string 'PASS'/'FAIL'
    let effectivePass = passFlag;
    if (serviceName === 'validate_tolerance') effectivePass = summaryStatus === 'PASS';
    else if (serviceName === 'cmc_validate_agents') effectivePass = summaryStatus === true;
    else if (serviceName === 'validate_requeirments') effectivePass = summaryStatus ?? null;

    if (serviceResult && !serviceResult.error && effectivePass !== null && (effectivePass === true || effectivePass === 'PASS')) {
  return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (serviceResult && (serviceResult.error || effectivePass === false || effectivePass === 'FAIL')) {
  return <AlertTriangle className="h-5 w-5 text-destructive" />;
    }
    // Pending or N/A
  return <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />;
  };

  const getEvaluationStatusBadge = (evaluationStatus: string) => {
    switch (evaluationStatus) {
      case 'validated':
        return {
          variant: 'default' as const,
          className: 'bg-accent/40 dark:bg-accent/20 text-foreground',
          text: '✓ Validado'
        };
      case 'overwritten':
        return {
          variant: 'secondary' as const,
          className: 'bg-muted text-foreground',
          text: '↻ Overwritten'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground',
          text: evaluationStatus
        };
    }
  };

  return {
    getStatusColor,
    getStatusIcon,
    getServiceStatusIcon,
    getEvaluationStatusBadge,
  };
} 