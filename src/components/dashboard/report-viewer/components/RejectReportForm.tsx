"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, X } from "lucide-react";
import {
  RejectFormData,
  TOLERANCE_ERROR_CODES,
  CMC_ERROR_CODES,
  REQUIREMENTS_ERROR_CODES,
  TOLERANCE_ERROR_LABELS,
  CMC_ERROR_LABELS,
  REQUIREMENTS_ERROR_LABELS,
} from '../types/validation.types';

interface RejectReportFormProps {
  certNo: string;
  onSubmit: (data: RejectFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RejectReportForm({ certNo, onSubmit, onCancel, isSubmitting = false }: RejectReportFormProps) {
  const [formData, setFormData] = useState<RejectFormData>({
    tolerance_errors: { codes: [], another_reason: '' },
    cmc_errors: { codes: [], another_reason: '' },
    requirements_errors: { codes: [], another_reason: '' },
    comment: ''
  });
  const [activeTab, setActiveTab] = useState<'phoenix' | 'supabase'>('phoenix');

  // Prefill Phoenix comment with static info derived from evaluation json_data
  useEffect(() => {
    let mounted = true;
    const prefill = async () => {
      try {
        const resp = await fetch(`/api/certificates/${encodeURIComponent(certNo)}/report`);
        const data = await resp.json();
        if (!resp.ok || !data?.json_data) return;
        const json = data.json_data;

        // Requirements summary
        const requirements = json?.validate_requeirments || json?.validate_requirements || json?.WizardRequirements || json?.result?.WizardRequirements;
        const evalByGroup = requirements?.evaluation_by_group || json?.evaluation_by_group || json?.result?.evaluation_by_group;
        const collectReqFailures = (): { count: number; groups: Array<{ group: string; failed: any[] }> } => {
          const groups: Array<{ group: string; failed: any[] }> = [];
          let total = 0;
          if (evalByGroup && typeof evalByGroup === 'object') {
            for (const [groupKey, groupVal] of Object.entries(evalByGroup as Record<string, any>)) {
              const reqs: any[] = (groupVal as any)?.RequirementsValidation || [];
              const failed = reqs.filter(r => (r?.ValidationStatus || '').toLowerCase() === 'non-compliant');
              if (failed.length > 0) {
                total += failed.length;
                groups.push({ group: groupKey, failed });
              }
            }
          }
          return { count: total, groups };
        };

        // Tolerance summary
        const tol = json?.validate_tolerance || json?.result?.pipeline_results || json?.pipeline_results;
        const extractTolFailures = (): string[] => {
          const msgs: string[] = [];
          const checks: any[] = tol?.tolerance_checks || json?.result?.tolerance_checks || [];
          for (const c of checks) {
            if ((c?.status || '').toLowerCase() === 'fail' || (c?.status || '').toLowerCase() === 'failed') {
              const spec = c?.specification ? ` (spec: ${c.specification})` : '';
              const note = c?.notes ? ` — ${c.notes}` : '';
              msgs.push(`${c?.description || 'Tolerance check failed'}${spec}${note}`);
            }
          }
          return msgs;
        };

        // CMC summary
        const cmc = json?.cmc_validate_agents || json?.result?.cmc || {};
        const extractCmcFailures = (): string[] => {
          const msgs: string[] = [];
          const msg = cmc?.message || json?.message;
          if (typeof msg === 'string' && msg.trim()) msgs.push(msg.trim());
          return msgs;
        };

        const reqSummary = collectReqFailures();
        const tolMsgs = extractTolFailures();
        const cmcMsgs = extractCmcFailures();

        let pre = '';
        if (reqSummary.count > 0) {
          const top = reqSummary.groups[0];
          const firstFailed = top?.failed?.[0];
          const groupLabel = (top?.group || 'requirements').replace(/_/g, ' ');
          const notes = firstFailed?.Notes ? ` Notes: ${firstFailed.Notes}` : '';
          pre = `${reqSummary.count} requirement(s) failed — group: ${groupLabel}.${notes}`.trim();
        } else if (tolMsgs.length > 0) {
          pre = `Tolerance failures detected: ${tolMsgs[0]}`;
        } else if (cmcMsgs.length > 0) {
          pre = `CMC issues detected: ${cmcMsgs[0]}`;
        }

        if (mounted && pre && !formData.comment) {
          setFormData(prev => ({ ...prev, comment: pre }));
        }
      } catch {
        // ignore prefill failures
      }
    };
    prefill();
    return () => { mounted = false; };
  }, [certNo]);

  type ErrorCategory = 'tolerance_errors' | 'cmc_errors' | 'requirements_errors';
  const handleCheckboxChange = (category: ErrorCategory, code: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        codes: checked 
          ? [...prev[category].codes, code]
          : prev[category].codes.filter(c => c !== code)
      }
    }));
  };

  const handleAnotherReasonChange = (category: ErrorCategory, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        another_reason: value
      }
    }));
  };
  const handleCommentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      comment: value
    }));
  };

  const isFormValid = () => {
    const { tolerance_errors, cmc_errors, requirements_errors } = formData;

    // If "another_reason" is selected in any category, text must be provided
    const checkAnotherReason = (category: typeof tolerance_errors) => {
      if (category.codes.includes('another_reason')) {
        return category.another_reason.trim() !== '';
      }
      return true;
    };

    const commentValid = (formData.comment || '').trim().length > 0;
    return (
      checkAnotherReason(tolerance_errors) &&
      checkAnotherReason(cmc_errors) &&
      checkAnotherReason(requirements_errors) &&
      commentValid
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || isSubmitting) return;
    
    // Filter out empty categories
    const submitData: RejectFormData = {
      tolerance_errors: formData.tolerance_errors.codes.length > 0 ? formData.tolerance_errors : { codes: [], another_reason: '' },
      cmc_errors: formData.cmc_errors.codes.length > 0 ? formData.cmc_errors : { codes: [], another_reason: '' },
      requirements_errors: formData.requirements_errors.codes.length > 0 ? formData.requirements_errors : { codes: [], another_reason: '' },
      comment: (formData.comment || '').trim()
    };
    
    await onSubmit(submitData);
  };

  const renderErrorSection = (
    title: string,
    category: ErrorCategory,
    errorCodes: Record<string, string>,
    errorLabels: Record<string, string>
  ) => {
    const categoryData = formData[category];
    const hasAnotherReason = categoryData.codes.includes('another_reason');

    return (
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(errorCodes).map(([, code]) => (
            <div key={code} className="flex items-start space-x-3">
              <Checkbox
                id={`${category}-${code}`}
                checked={categoryData.codes.includes(code)}
                onCheckedChange={(checked) => 
                  handleCheckboxChange(category, code, checked as boolean)
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor={`${category}-${code}`}
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                {errorLabels[code]}
              </Label>
            </div>
          ))}
          
          {/* Custom reason text area */}
          {hasAnotherReason && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <Label htmlFor={`${category}-reason`} className="text-sm font-medium mb-2 block">
                Specify the other reason:
              </Label>
              <Textarea
                id={`${category}-reason`}
                placeholder="Please provide details about the specific issue..."
                value={categoryData.another_reason}
                onChange={(e) => handleAnotherReasonChange(category, e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className="resize-none"
              />
              {hasAnotherReason && categoryData.another_reason.trim() === '' && (
                <p className="text-xs text-destructive-foreground bg-destructive/10 px-2 py-1 rounded mt-1">
                  Please provide a description when selecting &quot;Other reason&quot;
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     <div className="bg-muted rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
       <div className="sticky top-0 bg-muted border-b border-border p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold">Reject Report</h2>
                <p className="text-sm text-muted-foreground">
                  Certificate: <span className="font-mono font-medium">{certNo}</span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs header */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={activeTab === 'phoenix' ? 'default' : 'outline'} onClick={() => setActiveTab('phoenix')}>Phoenix Endpoint</Button>
            <Button size="sm" variant={activeTab === 'supabase' ? 'default' : 'outline'} onClick={() => setActiveTab('supabase')}>Supabase Notes (optional)</Button>
          </div>
        </div>

        {activeTab === 'phoenix' && (
          <div className="px-6 pb-2 space-y-4">
            <div className="bg-muted/20 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                This section sends the decision to Phoenix. Only the Comment below will be submitted to Phoenix.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'supabase' && (
          <div className="px-6 pb-6 space-y-6">
            <div className="bg-muted/20 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Optional internal notes for Supabase. These do not affect Phoenix.
              </p>
            </div>

            {/* Tolerance Errors */}
            {renderErrorSection(
              "Tolerance Errors",
              "tolerance_errors",
              TOLERANCE_ERROR_CODES,
              TOLERANCE_ERROR_LABELS
            )}

            {/* CMC Errors */}
            {renderErrorSection(
              "CMC Errors",
              "cmc_errors",
              CMC_ERROR_CODES,
              CMC_ERROR_LABELS
            )}

            {/* Requirements Errors */}
            {renderErrorSection(
              "Requirements Errors",
              "requirements_errors",
              REQUIREMENTS_ERROR_CODES,
              REQUIREMENTS_ERROR_LABELS
            )}
          </div>
        )}

        <Separator />

        <div className="p-6 bg-muted/20">
          <div className="mb-4">
            <Label htmlFor="rejection-comment" className="text-sm font-medium mb-2 block">
              Comment (required)
            </Label>
            <Textarea
              id="rejection-comment"
              placeholder="Provide a concise rationale for the rejection..."
              value={formData.comment || ''}
              onChange={(e) => handleCommentChange(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
            {(!formData.comment || !formData.comment.trim()) && (
              <p className="text-xs text-destructive-foreground bg-destructive/10 px-2 py-1 rounded mt-1">
                Please provide a comment.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
          {!isFormValid() && (
            <p className="text-xs text-muted-foreground mt-2 text-right">
              Please provide a valid comment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
