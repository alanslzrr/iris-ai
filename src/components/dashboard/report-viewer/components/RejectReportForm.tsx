"use client";

import { useState } from 'react';
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
  });

  const handleCheckboxChange = (category: keyof RejectFormData, code: string, checked: boolean) => {
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

  const handleAnotherReasonChange = (category: keyof RejectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        another_reason: value
      }
    }));
  };

  const isFormValid = () => {
    const { tolerance_errors, cmc_errors, requirements_errors } = formData;
    
    // At least one category must have selected codes
    const hasToleranceErrors = tolerance_errors.codes.length > 0;
    const hasCmcErrors = cmc_errors.codes.length > 0;
    const hasRequirementErrors = requirements_errors.codes.length > 0;
    
    if (!hasToleranceErrors && !hasCmcErrors && !hasRequirementErrors) {
      return false;
    }

    // If "another_reason" is selected, text must be provided
    const checkAnotherReason = (category: typeof tolerance_errors) => {
      if (category.codes.includes('another_reason')) {
        return category.another_reason.trim() !== '';
      }
      return true;
    };

    return checkAnotherReason(tolerance_errors) && 
           checkAnotherReason(cmc_errors) && 
           checkAnotherReason(requirements_errors);
  };

  const handleSubmit = async () => {
    if (!isFormValid() || isSubmitting) return;
    
    // Filter out empty categories
    const submitData: RejectFormData = {
      tolerance_errors: formData.tolerance_errors.codes.length > 0 ? formData.tolerance_errors : { codes: [], another_reason: '' },
      cmc_errors: formData.cmc_errors.codes.length > 0 ? formData.cmc_errors : { codes: [], another_reason: '' },
      requirements_errors: formData.requirements_errors.codes.length > 0 ? formData.requirements_errors : { codes: [], another_reason: '' },
    };
    
    await onSubmit(submitData);
  };

  const renderErrorSection = (
    title: string,
    category: keyof RejectFormData,
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
                <p className="text-xs text-destructive mt-1">
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

        <div className="p-6 space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">
              Select the specific errors found in each validation category. 
              At least one error must be selected to proceed with rejection.
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

        <Separator />

        <div className="p-6 bg-muted/20">
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
              Please select at least one error to proceed with rejection
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
