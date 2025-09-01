/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleMarkdown } from "./SimpleMarkdown";
import { ResultsData } from "../types/results.types";

interface AiAnalysisSectionProps {
  results: ResultsData;
}

export function AiAnalysisSection({ results }: AiAnalysisSectionProps) {
  const formatAnalysisText = (text: string): string => {
    if (!text) return '';

    const sectionLabels = [
      'Key findings',
      'Requirements',
      'Measurement uncertainty',
      'Measurements',
      'Tolerance checks',
      'Tolerance',
      'Tolerance/measurement verification',
      'Unverified points',
      'CMC/validation',
      'CMC',
      'Traceability',
      'CMC traceability',
      'Overall',
      'Agreements',
      'Contradictions/limitations',
      'Skipped/not-verifiable checks',
      'Document non-compliance',
      'Contradiction resolution',
      'Impact & next steps',
      'Impact',
      'Aggregate'
    ];

    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    let result = text.replace(/\r\n?/g, '\n').trim();

    // Remove a leading standalone "Analysis" heading if present
    result = result.replace(/^\s*Analysis\s*\n+/i, '');

    // Remove stray mid-text "Analysis" heading that sometimes appears after a period
    result = result.replace(/([.!?])\s*Analysis\s*\n+/g, '$1\n\n');

    // Normalize combined CMC+Traceability labels
    result = result
      .replace(/(^|\n)CMC\s*\n+\s*traceability\s*:/gi, '$1CMC traceability:')
      .replace(/(^|\n)CMC\s*[\/&]\s*traceability\s*:/gi, '$1CMC traceability:')
      .replace(/(^|\n)CMC\s+and\s+traceability\s*:/gi, '$1CMC traceability:');

    // Insert paragraph breaks and bold labels for known sections
    for (const label of sectionLabels) {
      const pattern = new RegExp(`(^|[\\n.;)])\\s*(${escapeRegex(label)})\\s*:`, 'gi');
      result = result.replace(pattern, (_m, pre, grp) => `${pre}\n\n**${grp}:**`);
    }

    // Special handling within Key findings: turn 1) ... 2) ... into an ordered list
    const keyFindingsRegex = /\*\*Key findings:\*\*([\s\S]*?)(\n\n\*\*|$)/i;
    result = result.replace(keyFindingsRegex, (_m, content: string, tail: string) => {
      let sectionBody = content;
      // Normalize number markers: 1) -> 1.
      sectionBody = sectionBody.replace(/\s*(\d+)\)\s+/g, (mm, n) => `\n${n}. `);
      // Bold a leading token within list items if it looks like a label before a colon
      sectionBody = sectionBody.replace(/(?:^|\n)(\d+)\.\s+([^\n:]{2,}?):\s*/g, (_mm, n, lbl) => `\n${n}. **${lbl}:** `);
      // Ensure each numbered item is on its own line
      sectionBody = sectionBody.replace(/\s+(\d+)\.\s/g, (_mm, n) => `\n${n}. `);
      return `**Key findings:**${sectionBody}${tail || ''}`;
    });

    return result;
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      {results.openai_analysis && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg underline-phoenix">Assessment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {results.openai_analysis.error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-foreground opacity-70 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h5 className="text-sm font-medium">Analysis Error</h5>
                    <p className="text-sm text-foreground mt-1">{results.openai_analysis.error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {results.openai_analysis.summary && results.openai_analysis.analysis && (
              <div className="space-y-4">
                {/* Summary Section */}
                <div>
                  <h5 className="text-sm text-muted-foreground mb-2 underline-phoenix">Summary</h5>
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <SimpleMarkdown className="rv-typography">
                      {results.openai_analysis.summary}
                    </SimpleMarkdown>
                  </div>
                </div>
                
                {/* Analysis Section */}
                <div>
                  <h5 className="text-sm text-muted-foreground mb-2 underline-phoenix">Analysis</h5>
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <SimpleMarkdown className="rv-typography">
                      {formatAnalysisText(results.openai_analysis.analysis)}
                    </SimpleMarkdown>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground italic border-t border-border pt-2">
                  This analysis was generated from the combined results of all validation services.
                </div>
              </div>
            )}
            {/* Human recommendation (post-validation) if present in validation status API can be shown elsewhere */}
          </CardContent>
        </Card>
      )}

      {/* Initial Payloads */}
      {results.initial_json_payload || results.initial_pdf_payload_base64 ? (
        <Card className="shadow-xs">
          <CardContent>
            <details className="group">
              <summary className="cursor-pointer p-4 font-medium text-foreground hover:bg-muted/50 rounded-t-lg">
                View Initial Payloads Used
              </summary>
              <div className="p-4 border-t border-border">
                {results.initial_json_payload && (
                  <div>
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1">Initial JSON Payload:</h5>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-60 border border-border">
                      {JSON.stringify(results.initial_json_payload, null, 2)}
                    </pre>
                  </div>
                )}
                {results.initial_pdf_payload_base64 && (
                  <div>
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1">Initial PDF Payload:</h5>
                    <p className="text-xs text-muted-foreground">The PDF was used as a Base64 buffer (showing first 100 chars):</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                      {results.initial_pdf_payload_base64.substring(0,100)}...
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      ) : null}

      {/* Display initial payloads if they exist */}
      {((results as any).initial_json_payload || (results as any).initial_pdf_payload_base64) && (
        <Card className="shadow-xs">
          <CardContent>
            <details className="group">
              <summary className="cursor-pointer p-4 font-medium text-foreground hover:bg-muted rounded-t-lg list-none">
                View Initial Payloads Used
              </summary>
              <div className="border-t border-border p-4 space-y-4">
                {(results as any).initial_json_payload && (
                  <div>
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1">Initial JSON Payload:</h5>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 border">
                      {JSON.stringify((results as any).initial_json_payload, null, 2)}
                    </pre>
                  </div>
                )}
                {(results as any).initial_pdf_payload_base64 && (
                  <div>
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1">Initial PDF Payload:</h5>
                    <div className="bg-muted p-3 rounded text-xs border font-mono">
                      {((results as any).initial_pdf_payload_base64 as string).substring(0, 100)}...
                      <div className="text-muted-foreground text-xs mt-1 italic">
                        (Base64 truncated for display)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 