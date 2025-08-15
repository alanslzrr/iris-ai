/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TolerancePipelineSection } from "./TolerancePipelineSection";

interface ToleranceSectionProps {
  serviceData: any;
}

export function ToleranceSection({ serviceData }: ToleranceSectionProps) {
  // Handle both new structure (direct pipeline_results) and legacy structure (nested under result)
  const pipelineResults = serviceData?.pipeline_results || serviceData?.result?.pipeline_results;
  const legacyResult = serviceData?.result;
  
  // Check for legacy tolerance_checks structure
  const hasLegacyToleranceChecks = legacyResult?.tolerance_checks && Array.isArray(legacyResult.tolerance_checks) && legacyResult.tolerance_checks.length > 0;

  // Check for any tolerance data
  if (!pipelineResults && !legacyResult && !hasLegacyToleranceChecks) {
    return (
      <div className="space-y-6">
        {/* Error State */}
        {serviceData?.error && (
          <Card className="shadow-xs border-l-4 border-border bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-sm text-foreground">Error in Tolerance V2 service: {serviceData.error}</p>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {!serviceData?.error && (
          <Card className="shadow-xs border-l-4 border-border bg-muted">
            <CardContent className="p-4">
              <p className="text-sm text-foreground">No pipeline results available from Tolerance V2 service.</p>
            </CardContent>
          </Card>
        )}

        {/* Input Source Info */}
        {serviceData?.inputSource && (
          <Card className="shadow-xs">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground italic">
                Tolerance validation used: {serviceData.inputSource.toUpperCase()} payload
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prioritize pipeline results (new structure) over legacy result structure */}
      {pipelineResults ? (
        <TolerancePipelineSection pipelineResults={pipelineResults} />
      ) : hasLegacyToleranceChecks ? (
        <>
          {/* Legacy Tolerance Summary */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg underline-phoenix">Tolerance Validation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Checks</label>
                  <div className="text-2xl font-bold text-foreground mt-1">{legacyResult.total_count || 0}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Passed</label>
                  <div className="text-2xl font-bold text-foreground mt-1">{legacyResult.passed_count || 0}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Failed</label>
                  <div className="text-2xl font-bold text-foreground mt-1">{legacyResult.failed_count || 0}</div>
                </div>
              </div>

              {/* Overall Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overall Status</label>
                <div className="mt-1">
                  <Badge variant={legacyResult.overall_pass ? 'default' : 'destructive'}>
                    {legacyResult.overall_pass ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legacy Tolerance Checks */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg">Tolerance Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {legacyResult.tolerance_checks.map((check: any, index: number) => (
                  <Card key={index} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{check.description}</h4>
                         <Badge variant={check.status === 'PASS' ? 'default' : 'secondary'}>
                          {check.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Measured Value:</span>
                          <span className="ml-2 font-mono">{check.measured_value} {check.unit}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Tolerance Range:</span>
                          <span className="ml-2 font-mono">
                            {check.tolerance_min} - {check.tolerance_max} {check.unit}
                          </span>
                        </div>
                      </div>
                      
                      {check.specification && (
                        <div className="mt-2">
                          <span className="font-medium text-muted-foreground">Specification:</span>
                          <p className="text-sm text-foreground mt-1">{check.specification}</p>
                        </div>
                      )}
                      
                      {check.notes && (
                        <div className="mt-2">
                          <span className="font-medium text-muted-foreground">Notes:</span>
                          <p className="text-sm text-foreground mt-1">{check.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Error handling */}
      {serviceData?.error && (
        <Card className="shadow-xs border-l-4 border-destructive bg-destructive/10 dark:bg-destructive/15">
          <CardContent className="p-4">
            <p className="text-sm text-foreground">Error in Tolerance service: {serviceData.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Input Source Info */}
      {serviceData?.inputSource && (
        <Card className="shadow-xs">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground italic">
              Tolerance validation used: {serviceData.inputSource.toUpperCase()} payload
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 