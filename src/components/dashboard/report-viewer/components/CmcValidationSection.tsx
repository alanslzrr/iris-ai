/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleMarkdown } from "./SimpleMarkdown";

interface CmcValidationSectionProps {
  serviceData: any;
}

// Auto-linkify helper function
function autoLinkify(text: string) {
  return text.replace(
    /(?<!\]|\()((https?:\/\/)[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?![\w\-._~:/?#[\]@!$&'()*+,;=%]*\))/g,
    (url) => `[${url}](${url})`
  );
}

export function CmcValidationSection({ serviceData }: CmcValidationSectionProps) {
  if (!serviceData?.pdf_analysis && !serviceData?.gemini_analysis) {
    return (
      <Card className="shadow-xs">
        <CardContent className="p-6">
          <p className="text-muted-foreground">No CMC validation data available.</p>
        </CardContent>
      </Card>
    );
  }

  const parseWebSearchSpecifications = (specificationsText: string) => {
    if (!specificationsText) return [];
    
    // Split by sections (## headers)
    const sections = specificationsText.split(/(?=^## )/m);
    
    return sections.map((section, sectionIndex) => {
      if (!section.trim()) return null;
      
      // Extract section title and content
      const lines = section.trim().split('\n');
      const titleLine = lines[0];
      const contentLines = lines.slice(1);
      
      // Extract title (remove ## and clean up)
      const title = titleLine.replace(/^##\s*/, '').trim();
      
      return {
        title,
        content: contentLines.join('\n').trim()
      };
    }).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Input Source moved to bottom */}

      {/* Skipped or error states */}
      {serviceData.skipped && (
        <Card className={`shadow-xs ${
          serviceData.templateValidated 
            ? 'bg-accent/20 dark:bg-accent/10' 
            : 'border-l-4 border-l-yellow-500 bg-muted'
        }`}>
          <CardContent className="p-4">
            <p className={`text-sm ${
              serviceData.templateValidated 
              ? 'text-foreground' 
              : 'text-foreground'
            }`}>
              {serviceData.templateValidated 
                ? `CMC validation completed via template: ${serviceData.reason}`
                : `CMC service skipped: ${serviceData.reason}`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {serviceData.error && (
        <Card className="shadow-xs border-l-4 border-destructive bg-destructive/10 dark:bg-destructive/15">
          <CardContent className="p-4">
      <p className="text-sm text-foreground">Error in CMC service: {serviceData.error}</p>
          </CardContent>
        </Card>
      )}

      {/* CMC Evaluation (AI) Section */}
      {serviceData?.gemini_analysis?.VERIDICT && (
        <Card className={`shadow-xs ${
          serviceData.gemini_analysis.VERIDICT.Assessment === 'PASS' ? '' 
          : 'border-l-4 border-l-destructive'
        }`}>
          <CardHeader>
            <CardTitle className="text-lg underline-phoenix">CMC Evaluation (AI)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Assessment</label>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold border mt-1 bg-background text-foreground border-border">
                  <span className={`h-3 w-3 rounded-full mr-2 ${serviceData.gemini_analysis.VERIDICT.Assessment === 'PASS' ? 'bg-emerald-500' : 'bg-destructive'}`}></span>
                  {serviceData.gemini_analysis.VERIDICT.Assessment}
                </div>
              </div>
              <div className="md:justify-self-end">
                <label className="text-sm text-muted-foreground">Confidence</label>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold border mt-1 bg-background text-foreground border-border">
                  {serviceData.gemini_analysis.VERIDICT.Confidence}
                </div>
              </div>
            </div>

            {serviceData.gemini_analysis.VERIDICT.Rationale && (
              <div>
                <h5 className="text-sm text-muted-foreground mb-2 underline-phoenix">Rationale</h5>
                <div className="bg-muted border border-border rounded-lg p-4 mt-2 shadow-sm">
                  <SimpleMarkdown className="rv-typography">
                    {autoLinkify(serviceData.gemini_analysis.VERIDICT.Rationale)}
                  </SimpleMarkdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* General Status Section */}
      {serviceData?.pdf_analysis?.message && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg underline-phoenix">General Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5 mr-3">
                <div className="w-5 h-5 text-primary">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-primary mb-1">Analysis Result</h5>
                <p className="text-sm text-foreground">{serviceData.pdf_analysis.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Analysis Details Section */}
      {serviceData?.pdf_analysis?.compliance_analyses && serviceData.pdf_analysis.compliance_analyses.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg underline-phoenix">Compliance Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {serviceData.pdf_analysis.compliance_analyses.map((analysis: any, idx: number) => (
                <div key={idx} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-6 py-4 border-b border-border">
                    <h5 className="font-semibold text-foreground">
                      Compliance Analysis: {analysis.matched_instrument_type || `Data Set ${idx + 1}`}
                    </h5>
                  </div>
                  <div className="p-6 space-y-3">
                    {analysis.measurements?.map((measurement: any, mIdx: number) => (
                      <details key={mIdx} className="group">
                <summary className="cursor-pointer bg-muted rounded-lg p-4 border border-border hover:bg-muted/40 transition-colors duration-200 list-none">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">
                              {measurement.nominal_value?.value} {measurement.nominal_value?.unit} - {measurement.parameter}
                            </span>
                            <Badge variant={measurement.is_compliant ? 'default' : 'destructive'} className="text-xs font-semibold"> 
                              {measurement.is_compliant ? 'Compliant' : 'Non-compliant'}
                            </Badge>
                          </div>
                        </summary>
                <div className="bg-muted border border-border border-t-0 rounded-b-lg p-4 space-y-3">
                          {/* Key Metrics Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-muted p-2 rounded border">
                              <span className="font-semibold text-muted-foreground">Certificate Uncertainty:</span>
                              <div className="text-foreground font-mono">{measurement.certificate_uncertainty?.value} {measurement.certificate_uncertainty?.unit}</div>
                            </div>
                            <div className="bg-muted p-2 rounded border">
                              <span className="font-semibold text-muted-foreground">CMC Scope:</span>
                              <div className="text-foreground font-mono">{measurement.scope_cmc?.value} {measurement.scope_cmc?.unit}</div>
                            </div>
                          </div>
                          
                          {/* CMC Calculation */}
                          {measurement.scope_cmc?.calculation && (
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CMC Calculation</span>
                              <div className="whitespace-pre-wrap font-mono bg-muted p-2 rounded border border-border text-muted-foreground mt-1 text-xs">
                                {measurement.scope_cmc.calculation}
                              </div>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {measurement.notes && (
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</span>
                              <div className="text-xs text-foreground mt-1 bg-muted p-2 rounded border">
                                {measurement.notes}
                              </div>
                            </div>
                          )}
                          
                          {/* Raw measurement data for debugging */}
                          <details className="group">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              View Raw Measurement Data
                            </summary>
                            <div className="bg-muted p-2 rounded border border-border mt-1 max-h-40 overflow-auto">
                              <pre className="text-xs">{JSON.stringify(measurement, null, 2)}</pre>
                            </div>
                          </details>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No detailed PDF compliance analyses available */}
      {(!serviceData.pdf_analysis?.compliance_analyses || serviceData.pdf_analysis.compliance_analyses.length === 0) && 
       !serviceData.pdf_analysis?.message && 
       !serviceData.skipped && 
       !serviceData.error && (
        <Card className="shadow-xs">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground italic">No detailed PDF compliance analyses available for this service.</p>
          </CardContent>
        </Card>
      )}

      {/* Raw Response Data and Input Source */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <details className="group">
            <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
              View Complete Raw CMC Results
            </summary>
            <div className="bg-muted p-4 rounded-lg border border-border max-h-96 overflow-auto">
              <pre className="text-xs">{JSON.stringify(serviceData, null, 2)}</pre>
            </div>
          </details>
          {serviceData.inputSource && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground italic">
                CMC validation used: {serviceData.inputSource.toUpperCase()} payload
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 