/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, ChevronDown } from "lucide-react";
import { SimpleMarkdown } from "./SimpleMarkdown";

interface RequirementsSectionProps {
  serviceData: any;
}

// Auto-linkify helper function
function autoLinkify(text: string) {
  return text.replace(
    /(?<!\]|\()((https?:\/\/)[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?![\w\-._~:/?#[\]@!$&'()*+,;=%]*\))/g,
    (url) => `[${url}](${url})`
  );
}

export function RequirementsSection({ serviceData }: RequirementsSectionProps) {
  if (!serviceData?.evaluation_by_group) {
    return (
      <Card className="shadow-xs">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground font-medium">No requirements evaluation data available.</p>
        </CardContent>
      </Card>
    );
  }

  const evalData = serviceData.evaluation_by_group;

  // Compute PASS/FAIL from group summaries
  const computeAssessment = () => {
    try {
      const groups = evalData as Record<string, any>;
      let hasAny = false;
      for (const [groupKey, groupVal] of Object.entries(groups)) {
        if (groupKey === 'match_procedure' || groupKey === 'match_combination') {
          if (groupVal && typeof groupVal === 'object' && !(groupVal as any).ComplianceSummary) {
            for (const [, subVal] of Object.entries(groupVal as Record<string, any>)) {
              hasAny = true;
              if ((subVal as any)?.ComplianceSummary === 'Non-compliant') return false;
            }
            continue;
          }
        }
        hasAny = true;
        if ((groupVal as any)?.ComplianceSummary === 'Non-compliant') return false;
      }
      return hasAny ? true : null;
    } catch {
      return null;
    }
  };
  const computedPass = computeAssessment();

  const normalizeStatus = (status: string | undefined) => {
    if (!status) return 'OTHER';
    const value = String(status).toUpperCase().replace(/[^A-Z]/g, '_');
    if (value.includes('COMPLIANT') && !value.includes('NON')) return 'COMPLIANT';
    if (value.includes('NON') && value.includes('COMPLIANT')) return 'NON_COMPLIANT';
    if (value.includes('NOT') && value.includes('VERIFIABLE')) return 'NOT_VERIFIABLE';
    return 'OTHER';
  };

  const getStatusIcon = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'COMPLIANT':
        return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'NON_COMPLIANT':
        return <CheckCircle className="w-4 h-4 text-destructive dark:text-destructive" />;
      case 'NOT_VERIFIABLE':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
  };

  const renderStatusBadge = (status: string) => {
    return (
      <Badge
        variant="outline"
        className="bg-muted text-foreground border border-border inline-flex items-center gap-1"
      >
        {getStatusIcon(status)}
        <span>{status || 'N/A'}</span>
      </Badge>
    );
  };

  const renderDetailedRequirements = (displayName: string, data: any, sectionKey: string) => {
    if (!data || !data.RequirementsValidation || data.RequirementsValidation.length === 0) return null;
    
    return (
      <Card key={sectionKey} className="shadow-xs">
         <CardHeader className="bg-muted/20 text-foreground">
          <CardTitle className="text-lg font-semibold leading-none">
            {displayName} ({data.RequirementsValidation.length} rules)
          </CardTitle>
        </CardHeader>
        
        {/* Match Fields Info */}
        {data.MatchFields && Object.keys(data.MatchFields).length > 0 && (
          <CardContent className="bg-muted/20 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(data.MatchFields).map(([field, value]) => (
                <div key={field} className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="font-mono bg-muted px-3 py-2 rounded-md border text-xs font-medium">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
        
         <CardContent className="p-0">
          <div className="divide-y divide-border">
            {data.RequirementsValidation.map((req: any, index: number) => (
              <details key={index} className="group">
                <summary className="cursor-pointer list-none p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border border-border">
                        {getStatusIcon(req.ValidationStatus)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium leading-relaxed">{req.Requirement}</p>
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-180" />
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        {renderStatusBadge(req.ValidationStatus)}
                        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border border-border">
                          {req.EvaluationMethod}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </summary>
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fields Utilized</span>
                      <p className="text-sm text-foreground font-mono bg-muted p-3 rounded mt-1 border border-border shadow-sm">
                        {req.FieldsUtilized}
                      </p>
                    </div>
                    {req.Notes && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evaluation Notes</span>
                        <div className="text-sm text-foreground mt-1 bg-muted p-3 rounded border border-border shadow-sm">
                          <SimpleMarkdown className="rv-typography">
                            {autoLinkify(req.Notes)}
                          </SimpleMarkdown>
                        </div>
                      </div>
                    )}
                    {(req.CreatedBy || req.CreatedAt || req.UpdatedBy || req.UpdatedAt) && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audit Trail</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                          {req.CreatedBy && (
                            <div>
                              <span className="font-medium">Created by:</span> {req.CreatedBy}
                            </div>
                          )}
                          {req.CreatedAt && (
                            <div>
                              <span className="font-medium">Created at:</span> {new Date(req.CreatedAt).toLocaleString()}
                            </div>
                          )}
                          {req.UpdatedBy && (
                            <div>
                              <span className="font-medium">Updated by:</span> {req.UpdatedBy}
                            </div>
                          )}
                          {req.UpdatedAt && (
                            <div>
                              <span className="font-medium">Updated at:</span> {new Date(req.UpdatedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">

      {/* Requirements Validation Section */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg underline-phoenix">Requirements Validation</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Overall Verdict */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Assessment</label>
              <div className="mt-1">
                {(() => {
                  const v = String(serviceData.overall_verdict || '').toUpperCase();
                  const isPassByData = v === 'PASS' || v === 'TRUE' || v === 'YES';
                  const isFailByData = v === 'FAIL' || v === 'FALSE' || v === 'NO';
                  const isPass = computedPass === true || isPassByData;
                  const isFail = computedPass === false || isFailByData;
                  const label = isPass ? 'PASS' : isFail ? 'FAIL' : 'PENDING';
                  const dotClass = isPass ? 'bg-emerald-500' : isFail ? 'bg-destructive' : 'bg-amber-500';
                  return (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold border bg-background text-foreground border-border`}>
                      <span className={`h-3 w-3 rounded-full ${dotClass}`}></span>
                      {label}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="md:justify-self-end">
              <label className="text-sm text-muted-foreground">Confidence</label>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold border mt-1 bg-background text-foreground border-border">
                {/* No explicit confidence in data; show derived summary info */}
                {`Groups: ${Object.keys(evalData).length}`}
              </div>
            </div>
          </div>

          {/* Service Message */}
          {serviceData.message && (
            <div>
              <h5 className="text-sm text-muted-foreground mb-2 underline-phoenix">Service Message</h5>
              <div className="bg-muted border border-border rounded-lg p-4 mt-2 shadow-sm">
                <div className="text-sm text-foreground">{serviceData.message}</div>
              </div>
            </div>
          )}

          {/* Group Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(evalData).map(([groupKey, groupData]) => {
              const groupNames: Record<string, string> = {
                match_all: 'General Requirements',
                match_procedure: 'Procedure Requirements',
                match_customer: 'Customer Requirements',
                match_equipment: 'Equipment Requirements',
                match_combination: 'Combined Requirements'
              };
              
              // Handle nested structure for procedures
              if ((groupKey === 'match_procedure' || groupKey === 'match_combination') && 
                  groupData && typeof groupData === 'object' && 
                  !(groupData as any).ComplianceSummary) {
                
                return Object.entries(groupData as any).map(([procedureKey, procedureData]) => {
                  const baseName = groupNames[groupKey] || groupKey;
                  const displayName = `${baseName} (${procedureKey})`;
                  
                  return (
                    <Card key={`${groupKey}-${procedureKey}`} className="shadow-xs">
                      <CardContent className="p-4">
                        <h6 className="font-medium text-foreground mb-2 text-sm">{displayName}</h6>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Status</span>
                          {renderStatusBadge((procedureData as any).ComplianceSummary)}
                        </div>
                        {(procedureData as any).RequirementsValidation && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Rules</span>
                            <span className="text-foreground">{(procedureData as any).RequirementsValidation.length}</span>
                          </div>
                        )}
                        {/* Match Fields */}
                        {(procedureData as any).MatchFields && Object.keys((procedureData as any).MatchFields).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match Fields</span>
                            <div className="mt-1 space-y-1">
                              {Object.entries((procedureData as any).MatchFields).map(([field, value]) => (
                                <div key={field} className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                });
              } else {
                // Handle flat structure
                const groupName = groupNames[groupKey] || groupKey;
                
                return (
                  <Card key={groupKey} className="shadow-xs">
                    <CardContent className="p-4">
                      <h6 className="font-medium text-foreground mb-2 text-sm">{groupName}</h6>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Status</span>
                        {renderStatusBadge((groupData as any).ComplianceSummary)}
                      </div>
                      {(groupData as any).RequirementsValidation && (
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-muted-foreground">Rules</span>
                          <span className="text-foreground">{(groupData as any).RequirementsValidation.length}</span>
                        </div>
                      )}
                      {/* Match Fields */}
                      {(groupData as any).MatchFields && Object.keys((groupData as any).MatchFields).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match Fields</span>
                          <div className="mt-1 space-y-1">
                            {Object.entries((groupData as any).MatchFields).map(([field, value]) => (
                              <div key={field} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {typeof value === 'string' ? value : JSON.stringify(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        </CardContent>
      </Card>

      {/* Requirements Source Section */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg underline-phoenix">
            Requirements Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Detailed Requirements by Group */}
          <div className="space-y-6">
            {Object.entries(evalData).map(([groupKey, groupData]) => {
              const groupNames: Record<string, string> = {
                match_all: 'General Requirements',
                match_procedure: 'Procedure Requirements',
                match_customer: 'Customer Requirements',
                match_equipment: 'Equipment Requirements',
                match_combination: 'Combined Requirements'
              };
              
              // Handle nested structure for match_procedure and match_combination
              if (groupKey === 'match_procedure' || groupKey === 'match_combination') {
                if (groupData && typeof groupData === 'object' && !(groupData as any).ComplianceSummary) {
                  return Object.entries(groupData as any).map(([subKey, subData]) => 
                    renderDetailedRequirements(
                      `${groupNames[groupKey]} - ${subKey}`,
                      subData,
                      `${groupKey}_${subKey}`
                    )
                  );
                }
              }
              
              // Handle flat structure
              return renderDetailedRequirements(
                groupNames[groupKey] || groupKey,
                groupData,
                groupKey
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Wizard Requirements Section */}
      {(serviceData.WizardRequirements || serviceData.result?.WizardRequirements) && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg underline-phoenix">
              Wizard Requirements Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <details className="group">
              <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
                View Wizard Requirements Data ({Object.keys(serviceData.WizardRequirements || serviceData.result?.WizardRequirements || {}).length} categories)
              </summary>
              <div className="bg-muted p-4 rounded-lg border border-border max-h-96 overflow-auto">
                <pre className="text-xs">{JSON.stringify(serviceData.WizardRequirements || serviceData.result?.WizardRequirements, null, 2)}</pre>
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Raw Response Data */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <details className="group">
            <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
              View Complete Raw Requirements Results
            </summary>
            <div className="bg-muted p-4 rounded-lg border border-border max-h-96 overflow-auto">
              <pre className="text-xs">{JSON.stringify(serviceData, null, 2)}</pre>
            </div>
          </details>
          {serviceData.inputSource && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground italic">
                Requirements validation used: {serviceData.inputSource.toUpperCase()} payload
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 