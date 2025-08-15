/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServiceStatus } from "../hooks/useServiceStatus";
import { ResultsData } from "../types/results.types";

interface ServiceCardProps {
  title: string;
  status: string;
  passFlag: boolean | string | null;
  serviceName: string;
  results: ResultsData;
}

export function ServiceCard({ title, passFlag, serviceName, results }: ServiceCardProps) {
  const { getServiceStatusIcon } = useServiceStatus(results);
  const serviceData = results[serviceName as keyof ResultsData] as any;

  const getStatusText = (passFlag: boolean | string | null, serviceName: string) => {
    if (passFlag === true || passFlag === 'PASS') return 'PASS';
    if (passFlag === false || passFlag === 'FAIL') return 'FAIL';
    if (passFlag === null) return 'PENDING';
    return String(passFlag);
  };

  const getStatusVariant = (passFlag: boolean | string | null) => {
    if (passFlag === true || passFlag === 'PASS') return 'default' as const;
    if (passFlag === false || passFlag === 'FAIL') return 'destructive' as const;
    return 'secondary' as const;
  };

  const hasServiceData = (serviceName: string) => {
    return results[serviceName as keyof ResultsData] !== undefined && 
           results[serviceName as keyof ResultsData] !== null;
  };

  const getDetailedStatus = () => {
    // Handle skipped services with specific messaging
    if (serviceData?.skipped) {
      if (serviceData?.templateValidated) {
        const templateName = serviceData.reason?.match(/"([^"]+)"/)?.[1] || 'template';
        return `Already validated via template: ${templateName}`;
      }
      return serviceData.reason || 'Service was skipped';
    }

    // Handle CMC specific logic
    if (serviceName === 'cmc_validate_agents' && serviceData && !serviceData.skipped) {
      const hasValidationAnalyses = serviceData.pdf_analysis?.compliance_analyses && 
                                   serviceData.pdf_analysis.compliance_analyses.length > 0;
      
      const hasMeasurements = hasValidationAnalyses && 
                            serviceData.pdf_analysis.compliance_analyses.some((analysis: any) => 
                              analysis.measurements && analysis.measurements.length > 0
                            );
      
      if (!hasMeasurements) {
        if (!hasValidationAnalyses || 
            serviceData.pdf_analysis?.message?.includes('No validation required') ||
            serviceData.pdf_analysis?.message?.includes('no measurement points') ||
            serviceData.pdf_analysis?.message?.includes('previously validated')) {
          return 'No measurements required validation.';
        }
      }
    }

    // Default status messages
    if (passFlag === true || passFlag === 'PASS') {
      return 'Validation completed successfully';
    } else if (passFlag === false || passFlag === 'FAIL') {
      return 'Validation failed - review required';
    } else if (!hasServiceData(serviceName) && !serviceData?.skipped) {
      return 'Waiting for service data...';
    } else if (passFlag === null) {
      return 'Validation in progress...';
    }
    
    return `Status: ${String(passFlag)}`;
  };

  return (
    <Card className="@container/card shadow-xs">
      <CardHeader>
        <CardDescription className="text-xs text-muted-foreground">{title}</CardDescription>
        <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
          {getStatusText(passFlag, serviceName)}
        </CardTitle>
        <div className="flex items-center justify-end">
          {getServiceStatusIcon(serviceName, passFlag)}
        </div>
      </CardHeader>
      <CardContent className="flex-col items-start gap-1.5 text-sm">
        <div className={`line-clamp-2 text-sm ${
          serviceData?.templateValidated 
            ? 'text-muted-foreground font-medium' 
            : 'text-muted-foreground'
        }`}>
          {getDetailedStatus()}
        </div>
      </CardContent>
    </Card>
  );
} 