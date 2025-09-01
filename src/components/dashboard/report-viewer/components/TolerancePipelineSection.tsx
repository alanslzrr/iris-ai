/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleMarkdown } from "./SimpleMarkdown";

interface TolerancePipelineSectionProps {
  pipelineResults: any;
}

// Helper function to auto-linkify URLs (from original file)
function autoLinkify(text: string) {
  return text.replace(
    /(?<!\]|\()((https?:\/\/)[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?![\w\-._~:/?#[\]@!$&'()*+,;=%]*\))/g,
    (url) => `[${url}](${url})`
  );
}

// Complex web search specifications parser (from original JS lines 1865-1970)
function parseWebSearchSpecifications(specificationsText: string) {
  if (!specificationsText) return null;
  
  // Split by sections (## headers)
  const sections = specificationsText.split(/(?=^## )/m);
  
  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => {
        if (!section.trim()) return null;
        
        // Extract section title and content
        const lines = section.trim().split('\n');
        const titleLine = lines[0];
        const contentLines = lines.slice(1);
        
        // Extract title (remove ## and clean up)
        const title = titleLine.replace(/^##\s*/, '').trim();
        
        // Parse content
        const parsedContent = contentLines.map((line, lineIndex) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return null;
          
          // Handle bullet points
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
            const content = trimmedLine.replace(/^[•-]\s*/, '');
            // Bold the text before the first colon or dash
            const match = content.match(/^(.*?)(:|\s-)(.*)$/);
            if (match) {
              const label = match[1].trim();
              const separator = match[2];
              const rest = match[3].trim();
              return (
                <div key={lineIndex} className="flex items-start space-x-2 text-sm">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span className="text-foreground">
                    <strong>{label}</strong>{separator} {rest}
                  </span>
                </div>
              );
            } else {
              return (
                <div key={lineIndex} className="flex items-start space-x-2 text-sm">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span className="text-foreground">{content}</span>
                </div>
              );
            }
          }
          
          // Handle sub-bullets (indented)
          if (trimmedLine.startsWith('  -') || trimmedLine.startsWith('    -')) {
            const content = trimmedLine.replace(/^\s*-\s*/, '');
            return (
              <div key={lineIndex} className="flex items-start space-x-2 text-sm ml-4">
                <span className="text-muted-foreground mt-1">-</span>
                <span className="text-muted-foreground">{content}</span>
              </div>
            );
          }
          
          // Handle URLs (convert to clickable links)
          if (trimmedLine.includes('http')) {
            const urlMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              const url = urlMatch[1];
              const displayText = trimmedLine.replace(url, '').trim() || url;
              return (
                <div key={lineIndex} className="text-sm">
                  <span className="text-foreground">{displayText}</span>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline ml-1 break-all"
                  >
                    {url}
                  </a>
                </div>
              );
            }
          }
          
          // Handle regular text
          return (
            <div key={lineIndex} className="text-sm text-foreground">
              {trimmedLine}
            </div>
          );
        }).filter(Boolean);
        
        return (
          <div key={sectionIndex} className="border border-border rounded-lg p-3">
            <h6 className="font-medium text-foreground mb-2 text-sm">
              {title}
            </h6>
            <div className="space-y-1">
              {parsedContent}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TolerancePipelineSection({ pipelineResults }: TolerancePipelineSectionProps) {
  if (!pipelineResults) return null;

  const pr = pipelineResults;

  return (
    <div className="space-y-6">
      {/* 1. TOLERANCE VERIFICATION SECTION */}
      {pr.tolerance_verification && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg underline-phoenix">Tolerance Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
            {/* Main Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Assessment</label>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold border mt-1 bg-background text-foreground border-border">
                  <span className={`h-3 w-3 rounded-full mr-2 ${pr.tolerance_verification.verdict === 'PASS' ? 'bg-emerald-500' : pr.tolerance_verification.verdict === 'FAIL' ? 'bg-destructive' : 'bg-amber-500'}`}></span>
                  {pr.tolerance_verification.verdict}
                </div>
              </div>
              {pr.tolerance_verification.confidence && (
                <div className="md:justify-self-end">
                  <label className="text-sm text-muted-foreground">Confidence</label>
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold border mt-1 bg-background text-foreground border-border">
                    {pr.tolerance_verification.confidence}
                  </div>
                </div>
              )}
            </div>

            {/* Summary and Analysis */}
            {pr.tolerance_verification.summary && (
              <div>
                <h5 className="text-sm text-muted-foreground mb-2 underline-phoenix">Summary</h5>
                <div className="bg-muted border border-border rounded-lg p-4 mt-2 shadow-sm">
                  <SimpleMarkdown className="rv-typography">
                    {pr.tolerance_verification.summary}
                  </SimpleMarkdown>
                </div>
              </div>
            )}

            {pr.tolerance_verification.analysis && (
              <div>
                <h5 className="text-sm text-muted-foreground mb-2 underline-phoenix">Analysis</h5>
                <div className="bg-muted border border-border rounded-lg p-4 mt-2 shadow-sm">
                  <SimpleMarkdown className="rv-typography">
                    {pr.tolerance_verification.analysis}
                  </SimpleMarkdown>
                </div>
              </div>
            )}

            {/* Tolerance Model Applied */}
            {pr.tolerance_verification.tolerance_model && Array.isArray(pr.tolerance_verification.tolerance_model) && pr.tolerance_verification.tolerance_model.length > 0 && (
              <div>
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tolerance Model Applied</label>
                  <div className="w-48 h-0.5 bg-[oklch(var(--destructive))] mt-1 mb-3"></div>
                </div>
                <div className="space-y-2 mt-2">
                  {pr.tolerance_verification.tolerance_model.map((model: any, idx: number) => (
                    <div key={idx} className="bg-muted border border-border rounded-lg p-4">
                      <div className="font-medium text-foreground mb-2">{model.description || `Rule ${idx + 1}`}</div>
                      <div className="text-sm text-muted-foreground">
                        <div className="mb-1">
                          <span className="font-medium">Tolerance:</span> 
                  <span className="font-mono text-foreground ml-2 px-2 py-1 bg-muted rounded">{model.tolerance || '-'}</span>
                        </div>
                        {model.condition && (
                          <div>
                            <span className="font-medium">Condition:</span> 
                            <span className="ml-2 italic">{model.condition}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results by Measurement Point */}
            {pr.tolerance_verification.results && Array.isArray(pr.tolerance_verification.results) && pr.tolerance_verification.results.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 block">Results by Measurement Point</label>
                <div className="w-56 h-0.5 bg-[oklch(var(--destructive))] mt-1 mb-3"></div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-3 py-2 text-left font-semibold text-muted-foreground text-sm">Row ID</th>
                        <th className="border border-border px-3 py-2 text-left font-semibold text-muted-foreground text-sm">Status</th>
                        <th className="border border-border px-3 py-2 text-left font-semibold text-muted-foreground text-sm">Nominal Value</th>
                        <th className="border border-border px-3 py-2 text-left font-semibold text-muted-foreground text-sm">Applied Tolerance</th>
                        <th className="border border-border px-3 py-2 text-left font-semibold text-muted-foreground text-sm">Spec Tolerance Applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pr.tolerance_verification.results.map((result: any, idx: number) => (
                        <tr key={result.row_id || idx} className="hover:bg-muted/30">
                          <td className="border border-border px-3 py-2 text-sm font-mono">
                            {result.row_id || '-'}
                          </td>
                          <td className="border border-border px-3 py-2 text-sm">
                             <span className="px-2 py-1 rounded text-xs font-medium border bg-background text-foreground border-border inline-flex items-center gap-2">
                               <span className={`h-2 w-2 rounded-full ${result.match === true || result.match === 'PASS' ? 'bg-emerald-500' : result.match === false || result.match === 'FAIL' ? 'bg-destructive' : 'bg-amber-500'}`}></span>
                               {result.match === true ? 'PASS' : result.match === false ? 'FAIL' : String(result.match || '-')}
                             </span>
                          </td>
                          <td className="border border-border px-3 py-2 text-sm font-mono">
                            {result.nominal_value || '-'}
                          </td>
                          <td className="border border-border px-3 py-2 text-sm font-mono">
                            {result.applied_tolerance || '-'}
                          </td>
                          <td className="border border-border px-3 py-2 text-sm font-mono">
                            {result.spec_tolerance_applied || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. TOLERANCE SPECIFICATION SOURCES */}
      {(pr.tolerance_specification || pr.instrument_manual || pr.web_search || pr.pdf_extraction) && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Tolerance Specification Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
            <div className="space-y-6">
              {/* Tolerance Specification with Level Data (supports multiple levels) */}
              {pr.tolerance_specification?.tolerance_data?.level && pr.tolerance_specification?.tolerance_data?.matches?.length > 0 && (() => {
                const ts = pr.tolerance_specification.tolerance_data as any;
                const firstMatch = ts.matches[0] || {};
                const mf = firstMatch.MatchFields || {};

                const headerTitle = ts.level === '2' ? 'Procedure Match' : 'Database Specification Match';
                const headerDesc = ts.level === '2'
                  ? 'Procedure-only match (all other fields wildcard)'
                  : 'Direct match found in tolerance specification database';

                return (
                  <div className="space-y-4">
                    {/* Level Badge and Description */}
                    <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border border-border bg-muted text-destructive">
                          Level {ts.level}
                        </span>
                        <span className="text-foreground font-medium">{headerTitle}</span>
                      </div>
                      <p className="text-sm text-muted-foreground italic">{headerDesc}</p>
                    </div>

                    {/* Basic Information Grid (varies by level) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {ts.level === '2' ? (
                        <>
                          <div>
                            <label className="text-sm text-muted-foreground">Procedure</label>
                            <div className="text-sm text-foreground mt-1 font-mono">{mf.Procedure || 'Unknown'}</div>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Match Type</label>
                            <div className="text-sm text-foreground mt-1">{mf.MatchType || 'Procedure only'}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm text-muted-foreground">Manufacturer</label>
                            <div className="text-sm text-foreground mt-1 font-mono">{ts.manufacturer || 'Unknown'}</div>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Model</label>
                            <div className="text-sm text-foreground mt-1 font-mono">{ts.model || 'Unknown'}</div>
                          </div>
                          {ts.equipment_type && (
                            <div>
                              <label className="text-sm text-muted-foreground">Equipment Type</label>
                              <div className="text-sm text-foreground mt-1 font-mono">{ts.equipment_type}</div>
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <label className="text-sm text-muted-foreground">Match Count</label>
                        <div className="text-sm text-foreground mt-1">{ts.matches.length}</div>
                      </div>
                    </div>

                    {/* Matches Details - Specialized for Level 2 */}
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <h6 className="font-medium text-foreground mb-3 text-sm border-b border-border pb-1">
                        Matches Found ({ts.matches.length})
                      </h6>
                      <div className="space-y-3">
                        {ts.matches.map((match: any, idx: number) => (
                          <div key={idx} className="border border-border rounded-lg p-3">
                            {ts.level === '2' ? (
                              <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">Procedure Requirements & Tolerance Rules</div>
                                <div className="bg-muted p-3 rounded border border-border whitespace-pre-wrap text-xs font-mono max-h-60 overflow-auto">
                                  {(match.Requeirment || '').replace(/```text\n|```$/g, '')}
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="font-medium text-muted-foreground">Range:</span>
                                  <span className="ml-2 font-mono">{match.range || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Accuracy:</span>
                                  <span className="ml-2 font-mono">{match.accuracy || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Resolution:</span>
                                  <span className="ml-2 font-mono">{match.resolution || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Source:</span>
                                  <span className="ml-2">{match.source || 'N/A'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Level 1B - Tolerance Specification with Manufacturer/Model Match */}
              {!pr.tolerance_specification?.tolerance_data?.level && !pr.tolerance_specification?.tolerance_data?.matches && pr.tolerance_specification?.tolerance_data?.match_manufacturer_model && Array.isArray(pr.tolerance_specification.tolerance_data.match_manufacturer_model) && pr.tolerance_specification.tolerance_data.match_manufacturer_model.length > 0 && (
                <div className="space-y-4">
                  {/* Level Badge and Description */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border border-border bg-muted text-orange-500">
                        Level 1B
                      </span>
                      <span className="text-foreground font-medium">Manufacturer/Model Match</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Partial match found based on manufacturer and model</p>
                  </div>
                  
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Manufacturer</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.tolerance_specification.tolerance_data.manufacturer || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Model</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.tolerance_specification.tolerance_data.model || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Match Count</label>
                      <div className="text-sm text-foreground mt-1">{pr.tolerance_specification.tolerance_data.match_manufacturer_model.length}</div>
                    </div>
                  </div>

                  {/* Match Details */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
                      View Match Details ({pr.tolerance_specification.tolerance_data.match_manufacturer_model.length} match{pr.tolerance_specification.tolerance_data.match_manufacturer_model.length > 1 ? 'es' : ''})
                    </summary>
                    <div className="space-y-3">
                      {pr.tolerance_specification.tolerance_data.match_manufacturer_model.map((match: any, idx: number) => (
                       <div key={idx} className="bg-muted border border-border rounded-lg p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Range:</span>
                              <span className="ml-2 font-mono">{match.range || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Accuracy:</span>
                              <span className="ml-2 font-mono">{match.accuracy || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Resolution:</span>
                              <span className="ml-2 font-mono">{match.resolution || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Source:</span>
                              <span className="ml-2">{match.source || 'N/A'}</span>
                            </div>
                          </div>
                          {match.notes && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium">Notes:</span> {match.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Level 2 - Total Matches (Legacy) */}
              {!pr.tolerance_specification?.tolerance_data?.level && !pr.tolerance_specification?.tolerance_data?.match_manufacturer_model && pr.tolerance_specification?.total_matches && (
                <div className="space-y-4">
                  {/* Level Badge and Description */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border border-border bg-muted text-yellow-500">
                        Level 2
                      </span>
                      <span className="text-foreground font-medium">Total Matches</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Legacy format with total match count</p>
                  </div>
                  
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Total Matches</label>
                      <div className="text-sm text-foreground mt-1">{pr.tolerance_specification.total_matches}</div>
                    </div>
                  </div>

                  {/* Legacy Data */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
                      View Legacy Match Details
                    </summary>
                    <div className="bg-muted p-4 rounded-lg border border-border max-h-96 overflow-auto">
                      <pre className="text-xs">{JSON.stringify(pr.tolerance_specification.tolerance_data, null, 2)}</pre>
                    </div>
                  </details>
                </div>
              )}

              {/* Level 3 - Instrument Manual */}
              {pr.instrument_manual?.success && (
                <div className="space-y-4">
                  {/* Level Badge and Description */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border border-border bg-muted text-blue-500">
                        Level 3
                      </span>
                      <span className="text-foreground font-medium">Instrument Manual</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Specifications extracted from instrument manual</p>
                  </div>
                  
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Manufacturer</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.instrument_manual.manufacturer || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Model</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.instrument_manual.model || 'Unknown'}
                      </div>
                    </div>
                    {pr.instrument_manual.equipment_type && (
                      <div>
                        <label className="text-sm text-muted-foreground">Equipment Type</label>
                        <div className="text-sm text-foreground mt-1 font-mono">
                          {pr.instrument_manual.equipment_type}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-muted-foreground">Extraction Status</label>
                      <div className="text-sm text-foreground mt-1">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-green-500 border border-border">
                          Success
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Specifications */}
                  {pr.instrument_manual.specifications && (
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <h6 className="font-medium text-foreground mb-3 text-sm border-b border-border pb-1">
                        Extracted Specifications
                      </h6>
                      <div className="bg-muted border border-border rounded-lg p-4 shadow-sm whitespace-pre-wrap">
                        <SimpleMarkdown className="rv-typography">
                          {autoLinkify(pr.instrument_manual.specifications)}
                        </SimpleMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Level 4 - PDF Extraction */}
              {pr.pdf_extraction?.success && (
                <div className="space-y-4">
                  {/* Level Badge and Description */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border border-border bg-muted text-purple-500">
                        Level 4
                      </span>
                      <span className="text-foreground font-medium">PDF Extraction</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Specifications extracted from calibration certificate PDF</p>
                  </div>
                  
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Manufacturer</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.pdf_extraction.manufacturer || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Model</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.pdf_extraction.model || 'Unknown'}
                      </div>
                    </div>
                    {pr.pdf_extraction.equipment_type && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Equipment Type</label>
                        <div className="text-sm text-foreground mt-1 font-mono">
                          {pr.pdf_extraction.equipment_type}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Extraction Status</label>
                      <div className="text-sm text-foreground mt-1">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-green-500 border border-border">
                          Success
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Specifications */}
                  {pr.pdf_extraction.specifications && (
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <h6 className="font-medium text-foreground mb-3 text-sm border-b border-border pb-1">
                        Extracted Specifications
                      </h6>
                      <div className="bg-muted border border-border rounded-lg p-4 shadow-sm whitespace-pre-wrap">
                        <SimpleMarkdown className="rv-typography">
                          {autoLinkify(pr.pdf_extraction.specifications)}
                        </SimpleMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Calibration Data */}
                  {pr.pdf_extraction.calibration_data && (
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <h6 className="font-medium text-foreground mb-3 text-sm border-b border-border pb-1">
                        Calibration Data
                      </h6>
                      <div className="bg-muted border border-border rounded-lg p-4 shadow-sm whitespace-pre-wrap">
                        <SimpleMarkdown className="rv-typography">
                          {autoLinkify(pr.pdf_extraction.calibration_data)}
                        </SimpleMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Level 5 - Web Search Results */}
              {pr.web_search?.success && pr.web_search.specifications && (
                <div className="space-y-4">
                  {/* Level Badge and Description */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border border-border bg-muted text-destructive">
                        Level 5
                      </span>
                      <span className="text-foreground font-medium">Web Search Specifications</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Real-time web search for manufacturer specifications when no database matches found</p>
                  </div>
                  
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Manufacturer</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.web_search.manufacturer || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Model</label>
                      <div className="text-sm text-foreground mt-1 font-mono">
                        {pr.web_search.model || 'Unknown'}
                      </div>
                    </div>
                    {pr.web_search.equipment_type && (
                      <div>
                        <label className="text-sm text-muted-foreground">Equipment Type</label>
                        <div className="text-sm text-foreground mt-1 font-mono">
                          {pr.web_search.equipment_type}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-muted-foreground">Search Status</label>
                      <div className="text-sm text-foreground mt-1">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-green-500 border border-border">
                          Success
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Specifications */}
                  <div className="bg-muted border border-border rounded-lg p-4">
                    <h6 className="font-medium text-foreground mb-3 text-sm border-b border-border pb-1">
                      Extracted Specifications
                    </h6>
                    <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                      {parseWebSearchSpecifications(autoLinkify(pr.web_search.specifications))}
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-1">Raw captured text</div>
                      <pre className="text-xs bg-muted p-3 rounded border border-border whitespace-pre-wrap max-h-64 overflow-auto">
                        {pr.web_search.specifications}
                      </pre>
                    </div>
                  </div>

                  {/* Search Details */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
                      View Search Details
                    </summary>
                    <div className="bg-muted p-4 rounded-lg border border-border">
                      <div className="space-y-3 text-sm">
                        {pr.web_search.search_timestamp && (
                          <div>
                            <span className="font-medium text-muted-foreground">Search Timestamp:</span>
                            <span className="ml-2 text-foreground">{new Date(pr.web_search.search_timestamp).toLocaleString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-muted-foreground">Complete Search Response:</span>
                          <pre className="mt-2 text-xs bg-muted p-3 rounded border overflow-auto max-h-60">
                            {JSON.stringify(pr.web_search, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* Fallback - No structured data found */}
              {!pr.tolerance_specification?.tolerance_data?.level &&
               !pr.tolerance_specification?.tolerance_data?.match_manufacturer_model &&
               !pr.tolerance_specification?.total_matches &&
               !pr.instrument_manual?.success &&
               !pr.pdf_extraction?.success &&
               !pr.web_search?.success && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tolerance specification sources found.</p>
                </div>
              )}
            </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. COMPLETE CALIBRATION DATA SECTION */}
      {pr.pdf_extraction?.calibration_data?.length > 0 && (
        <Card className="shadow-xs">
            <CardHeader>
            <CardTitle className="text-lg">Complete Calibration Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
            {pr.pdf_extraction.calibration_data.map((cert: any, idx: number) => (
              <div key={idx} className="space-y-6">
                {/* Row 1: Certificate Information - Equipment Information - Calibration Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Certificate Info Card */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <h6 className="font-medium text-foreground mb-3 text-sm uppercase tracking-wide border-b border-border pb-1">Certificate Information</h6>
                    <div className="space-y-2 text-sm">
                      {cert.CertNo && <div><span className="font-medium text-muted-foreground">Cert No:</span> <span className="ml-2">{cert.CertNo}</span></div>}
                      {cert.Customer && <div><span className="font-medium text-muted-foreground">Customer:</span> <span className="ml-2">{cert.Customer}</span></div>}
                      {cert.CustomerCode && <div><span className="font-medium text-muted-foreground">Customer Code:</span> <span className="ml-2">{cert.CustomerCode}</span></div>}
                      {cert.AssetNo && <div><span className="font-medium text-muted-foreground">Asset No:</span> <span className="ml-2">{cert.AssetNo}</span></div>}
                      {cert.AssetDescription && <div><span className="font-medium text-muted-foreground">Asset Description:</span> <span className="ml-2">{cert.AssetDescription}</span></div>}
                      {cert.EquipmentType && <div><span className="font-medium text-muted-foreground">Equipment Type:</span> <span className="ml-2">{cert.EquipmentType}</span></div>}
                    </div>
                  </div>

                  {/* Equipment Info Card */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <h6 className="font-medium text-foreground mb-3 text-sm uppercase tracking-wide border-b border-border pb-1">Equipment Information</h6>
                    <div className="space-y-2 text-sm">
                      {cert.Manufacturer && <div><span className="font-medium text-muted-foreground">Manufacturer:</span> <span className="ml-2">{cert.Manufacturer}</span></div>}
                      {cert.Model && <div><span className="font-medium text-muted-foreground">Model:</span> <span className="ml-2">{cert.Model}</span></div>}
                      {cert.OperatingRange && <div><span className="font-medium text-muted-foreground">Operating Range:</span> <span className="ml-2">{cert.OperatingRange}</span></div>}
                    </div>
                  </div>

                  {/* Calibration Details Card */}
                  <div className="bg-muted border border-border rounded-lg p-4 shadow-sm">
                    <h6 className="font-medium text-foreground mb-3 text-sm uppercase tracking-wide border-b border-border pb-1">Calibration Details</h6>
                    <div className="space-y-2 text-sm">
                      {cert.CalDate && <div><span className="font-medium text-muted-foreground">Cal Date:</span> <span className="ml-2">{cert.CalDate}</span></div>}
                      {cert.DueDate && <div><span className="font-medium text-muted-foreground">Due Date:</span> <span className="ml-2">{cert.DueDate}</span></div>}
                      {cert.CalLocation && <div><span className="font-medium text-muted-foreground">Cal Location:</span> <span className="ml-2">{cert.CalLocation}</span></div>}
                      {cert.CalibratedBy && <div><span className="font-medium text-muted-foreground">Calibrated By:</span> <span className="ml-2">{cert.CalibratedBy}</span></div>}
                      {cert.CalibrationResult && <div><span className="font-medium text-muted-foreground">Calibration Result:</span> <span className="ml-2">{cert.CalibrationResult}</span></div>}
                    </div>
                  </div>
                </div>

                {/* Measurement Data */}
                {cert.Datasheet && Array.isArray(cert.Datasheet) && cert.Datasheet.length > 0 && (
                  <div>
                    <h6 className="font-medium text-foreground mb-3 text-sm uppercase tracking-wide">Measurement Data</h6>
                    <div className="space-y-4">
                      {cert.Datasheet.map((group: any, groupIdx: number) => (
                          <div key={groupIdx} className="border border-border rounded-lg overflow-hidden">
                            <div className="bg-phoenix-red text-phoenix-red-foreground px-4 py-2 font-medium text-sm">
                            {group.Group || `Measurement Group ${groupIdx + 1}`}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">Row ID</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">Parameter</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">Nominal</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">As Found</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">After Adj.</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">Low Limit</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">High Limit</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">Max Error</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">Uncertainty</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">TUR</th>
                                  <th className="border border-border px-2 py-1 text-left font-semibold text-muted-foreground text-xs">Units</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.Measurements && group.Measurements.map((meas: any, measIdx: number) => {
                                  let parameter = '';
                                  if (meas.MeasParameter && meas.MeasSubParameter) {
                                    parameter = `${meas.MeasParameter} - ${meas.MeasSubParameter}`;
                                  } else if (meas.MeasParameter) {
                                    parameter = meas.MeasParameter;
                                  } else if (meas.MeasSubParameter) {
                                    parameter = meas.MeasSubParameter;
                                  }
                                  
                                  const units = meas.MeasUnit || meas.Units || '-';
                                  
                                  return (
                                    <tr key={measIdx} className="hover:bg-muted/30">
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.RowId || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs">{parameter || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.Nominal || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.AsFound || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.AfterAdjustment || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.LowLimit || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.HighLimit || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.MaximumPermissibleError || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.MeasUncert || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{meas.TUR || '-'}</td>
                                      <td className="border border-border px-2 py-1 text-xs font-mono">{units}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Extracted JSON */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
                    View Raw Extracted Certificate JSON
                  </summary>
                  <div className="bg-muted p-4 rounded-lg border border-border max-h-96 overflow-auto">
                    <pre className="text-xs">{JSON.stringify(cert, null, 2)}</pre>
                  </div>
                </details>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Pipeline Results */}
      <Card className="shadow-xs">
        <CardContent>
          <details className="group">
            <summary className="cursor-pointer text-sm text-primary hover:underline mb-3">
              View Complete Raw Pipeline Results
            </summary>
            <div className="bg-muted p-4 rounded-lg border border-border max-h-96 overflow-auto">
              <pre className="text-xs">{JSON.stringify(pr, null, 2)}</pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
} 