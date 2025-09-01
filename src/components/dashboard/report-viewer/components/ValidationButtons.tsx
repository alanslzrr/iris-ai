"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { RejectReportForm } from './RejectReportForm';
import { RecommendationModal } from './RecommendationModal';
import { ValidationRecord, RejectFormData } from '../types/validation.types';

interface ValidationButtonsProps {
  certNo: string;
}

export function ValidationButtons({ certNo }: ValidationButtonsProps) {
  const [validationStatus, setValidationStatus] = useState<ValidationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [canReApprove, setCanReApprove] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const checkValidationStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/validation/status?cert_no=${encodeURIComponent(certNo)}`);
      const data = await response.json();

      if (response.ok && data.validated) {
        setValidationStatus(data);
        
        // If rejected, check if re-approval is possible
        if (data.status === 'REJECTED') {
          await checkReApprovalPossibility();
        } else {
          setCanReApprove(false);
        }
      } else {
        setValidationStatus(null);
        setCanReApprove(false);
      }
    } catch (error) {
      console.error('Error checking validation status:', error);
      toast({
        title: "Error",
        description: "Failed to check validation status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [certNo, toast]);

  const checkReApprovalPossibility = useCallback(async () => {
    try {
      const response = await fetch(`/api/validation/can-reapprove?cert_no=${encodeURIComponent(certNo)}`);
      const data = await response.json();
      
      if (response.ok) {
        setCanReApprove(data.can_reapprove);
      } else {
        setCanReApprove(false);
      }
    } catch (error) {
      console.error('Error checking re-approval possibility:', error);
      setCanReApprove(false);
    }
  }, [certNo]);

  // Check validation status on component mount
  useEffect(() => {
    checkValidationStatus();
  }, [checkValidationStatus]);

  const handleApprove = async () => {
    const confirmed = window.confirm("Do you confirm you approve this report?");
    if (!confirmed) return;
    setShowRecommendation(true);
  };

  const saveRecommendationAndApprove = async (feedbackText: string) => {
    try {
      setIsSubmitting(true);
      // Prompt for revision and justification comments before approving
      const revisionComment = window.prompt('Enter revision comment (required):') || '';
      if (!revisionComment.trim()) {
        toast({ title: 'Cancelled', description: 'Approval requires a revision comment.' });
        setIsSubmitting(false);
        return;
      }
      const justificationComment = window.prompt('Enter justification comment (optional):') || '';

      const response = await fetch('/api/validation/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cert_no: certNo, client_feedback: feedbackText, revision_comment: revisionComment.trim(), justification_comment: justificationComment.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        const calibrationId = data?.data?.CalibrationId ?? data?.data?.calibration_id ?? null;
        toast({
          title: "Validation recorded",
          description: `Certificate ${certNo} has been approved (Calibration ID: ${calibrationId ?? 'N/A'}).`,
        });
        setValidationStatus(data.data);
        setShowRecommendation(false);
      } else {
        // Show detailed error information
        const errorTitle = data.error?.includes('Phoenix') ? "Phoenix Approval Failed" : "Approval Error";
        const errorDescription = data.error || "Failed to approve report";
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
          duration: 8000, // Show longer for important errors
        });
      }
    } catch (error) {
      console.error('Error approving report:', error);
      toast({
        title: "Error",
        description: "Failed to approve report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (formData: RejectFormData) => {
    try {
      setIsSubmitting(true);
      // Filter out empty error categories
      const requestData: Record<string, unknown> = { cert_no: certNo };
      if (formData.tolerance_errors.codes.length > 0) {
        requestData.tolerance_errors = {
          codes: formData.tolerance_errors.codes,
          ...(formData.tolerance_errors.another_reason.trim() && {
            another_reason: formData.tolerance_errors.another_reason.trim()
          })
        };
      }
      if (formData.cmc_errors.codes.length > 0) {
        requestData.cmc_errors = {
          codes: formData.cmc_errors.codes,
          ...(formData.cmc_errors.another_reason.trim() && {
            another_reason: formData.cmc_errors.another_reason.trim()
          })
        };
      }
      if (formData.requirements_errors.codes.length > 0) {
        requestData.requirements_errors = {
          codes: formData.requirements_errors.codes,
          ...(formData.requirements_errors.another_reason.trim() && {
            another_reason: formData.requirements_errors.another_reason.trim()
          })
        };
      }
      if (formData.comment && formData.comment.trim()) {
        (requestData as any).comment = formData.comment.trim();
      }
      const response = await fetch('/api/validation/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
      if (response.ok) {
        const calibrationId = data?.data?.CalibrationId ?? data?.data?.calibration_id ?? null;
        toast({
          title: "Validation recorded",
          description: `Certificate ${certNo} has been rejected (Calibration ID: ${calibrationId ?? 'N/A'}).`,
          action: (
            <ToastAction altText="View activity" onClick={() => router.push('/dashboard/activity')}>
              View activity
            </ToastAction>
          ),
        });
        // Update local state
        setValidationStatus(data.data);
        setShowRejectForm(false);
        // Show server-generated comment preview if returned
        if (data?.phoenix_comment) {
          toast({ title: 'Rejection comment', description: data.phoenix_comment });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast({
        title: "Error",
        description: "Failed to reject report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!validationStatus) return null;
    const isApproved = validationStatus.status === 'APPROVED';
    const statusIcon = isApproved ? 
      <CheckCircle className="h-5 w-5 text-foreground opacity-70" /> : 
      <AlertTriangle className="h-5 w-5 text-foreground opacity-70" />;
    const statusBadge = isApproved ? (
      <Badge className="bg-accent/40 dark:bg-accent/20 text-foreground">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-destructive/10 text-foreground">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    );
    return (
      <Card className="shadow-xs bg-gradient-to-r from-muted/20 to-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {statusIcon}
              <div>
                <p className="text-sm font-semibold">
                  Report has been {validationStatus.status.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  By {validationStatus.approved_by} on {new Date(validationStatus.approved_at).toLocaleString()}
                </p>
              </div>
            </div>
            {statusBadge}
          </div>
          {/* Show rejection details if rejected */}
          {!isApproved && (
            <div className="mt-4 space-y-2">
              {validationStatus.tolerance_errors && (
                <div className="text-xs">
                  <span className="font-medium text-muted-foreground">Tolerance Issues:</span>
                  <span className="ml-2">{validationStatus.tolerance_errors.codes.join(', ')}</span>
                  {validationStatus.tolerance_errors.another_reason && (
                    <div className="text-muted-foreground italic mt-1">
                      &quot;{validationStatus.tolerance_errors.another_reason}&quot;
                    </div>
                  )}
                </div>
              )}
              {validationStatus.cmc_errors && (
                <div className="text-xs">
                  <span className="font-medium text-muted-foreground">CMC Issues:</span>
                  <span className="ml-2">{validationStatus.cmc_errors.codes.join(', ')}</span>
                  {validationStatus.cmc_errors.another_reason && (
                    <div className="text-muted-foreground italic mt-1">
                      &quot;{validationStatus.cmc_errors.another_reason}&quot;
                    </div>
                  )}
                </div>
              )}
              {validationStatus.requirements_errors && (
                <div className="text-xs">
                  <span className="font-medium text-muted-foreground">Requirements Issues:</span>
                  <span className="ml-2">{validationStatus.requirements_errors.codes.join(', ')}</span>
                  {validationStatus.requirements_errors.another_reason && (
                    <div className="text-muted-foreground italic mt-1">
                      &quot;{validationStatus.requirements_errors.another_reason}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Checking validation status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show status if already validated
  if (validationStatus) {
    return (
      <>
        {getStatusDisplay()}
        {validationStatus.status === 'REJECTED' && canReApprove && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              A new evaluation has been generated since the previous rejection. You may now approve this report.
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        )}
        {validationStatus.status === 'APPROVED' && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {validationStatus.client_feedback ? 'Client feedback saved. You can update it if needed.' : 'No client feedback yet. Generate now.'}
            </div>
            <div className="flex gap-2">
              {!validationStatus.client_feedback && (
                <Button variant="outline" size="sm" onClick={() => setShowRecommendation(true)}>Generate Recommendation</Button>
              )}
              {validationStatus.client_feedback && (
                <Button variant="outline" size="sm" onClick={() => setShowRecommendation(true)}>Update Recommendation</Button>
              )}
            </div>
          </div>
        )}
        {validationStatus.status === 'APPROVED' && validationStatus.client_feedback && (
          <Card className="shadow-xs mt-3">
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Client Feedback</div>
              <div className="text-sm whitespace-pre-wrap bg-muted/40 rounded-md p-3 border border-border">
                {validationStatus.client_feedback}
              </div>
            </CardContent>
          </Card>
        )}
        <RecommendationModal
          open={showRecommendation}
          onOpenChange={setShowRecommendation}
          certNo={certNo}
          initialPrompt={`Write a single continuous block of text, without titles, lists, visual or thematic divisions. The content must be directed exclusively to the final client of the evaluated instrument. Use technical, natural and direct writing. Do not simplify, do not explain, do not justify. Do not use discursive connectors. Do not include transitional phrases. Do not mention evaluated services or group information by category. Do not introduce logical structure or references to the analysis process. The text should include only information that impacts the operational use of the instrument. It should state whether the certificate contains the necessary elements to validate the results: identification of the equipment, procedure applied, traceability, dates, results and technical signature. It must indicate if measurement points were evaluated, how many, in which parameter, what was the technical tolerance applied, if there were out-of-limit values, and in which section of the operating range they are located. You should also state whether the measured values are covered by the declared measurement and calibration capability, and if applicable, which area should be considered restricted. Do not state what was not found. Do not mention searches, internal processes, manuals, errors, cross validations or sources. Do not repeat formulas or closures. End with a specific statement as to whether the instrument can be used and under what conditions. Use a natural tone as a technician's recommendation to the customer, without redundancies. Treat any json_data as context only and do not refer to analysis steps or sources. Format the output in Markdown with clear paragraph breaks; use bold for key operational facts and italics for nuanced conditions; do not include headings, lists, tables, labels, or code blocks.`}
          onSave={async ({ clientFeedback, revisionComment, justificationComment }) => {
            try {
              setIsSubmitting(true);
              const response = await fetch('/api/validation/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cert_no: certNo, client_feedback: clientFeedback, revision_comment: revisionComment, justification_comment: justificationComment })
              });
              const data = await response.json();
              if (response.ok) {
                const calibrationId = data?.data?.CalibrationId ?? data?.data?.calibration_id ?? null;
                toast({ title: 'Validation recorded', description: `Certificate ${certNo} has been approved (Calibration ID: ${calibrationId ?? 'N/A'}).` });
                setValidationStatus(data.data);
                setShowRecommendation(false);
              } else {
                // Show detailed error information
                const errorTitle = data.error?.includes('Phoenix') ? "Phoenix Approval Failed" : "Approval Error";
                const errorDescription = data.error || 'Failed to approve report';
                
                toast({ 
                  title: errorTitle, 
                  description: errorDescription, 
                  variant: 'destructive',
                  duration: 8000 // Show longer for important errors
                });
              }
            } catch (err) {
              console.error('Error approving report:', err);
              toast({ title: 'Error', description: 'Failed to approve report', variant: 'destructive' });
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </>
    );
  }

  // Show action buttons if not yet validated
  return (
    <>
      <Card className="shadow-xs bg-gradient-to-r from-primary/5 to-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold mb-1">Review Required</h4>
              <p className="text-xs text-muted-foreground">
                This report requires validation before it can be finalized.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
                className="border-destructive text-foreground hover:bg-destructive/10"
              >
                <ShieldX className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Rejection Form Modal */}
      {showRejectForm && (
        <RejectReportForm
          certNo={certNo}
          onSubmit={handleReject}
          onCancel={() => setShowRejectForm(false)}
          isSubmitting={isSubmitting}
        />
      )}
      <RecommendationModal
        open={showRecommendation}
        onOpenChange={setShowRecommendation}
        certNo={certNo}
        initialPrompt={`Write a single continuous block of text, without titles, lists, visual or thematic divisions. The content must be directed exclusively to the final client of the evaluated instrument. Use technical, natural and direct writing. Do not simplify, do not explain, do not justify. Do not use discursive connectors. Do not include transitional phrases. Do not mention evaluated services or group information by category. Do not introduce logical structure or references to the analysis process. The text should include only information that impacts the operational use of the instrument. It should state whether the certificate contains the necessary elements to validate the results: identification of the equipment, procedure applied, traceability, dates, results and technical signature. It must indicate if measurement points were evaluated, how many, in which parameter, what was the technical tolerance applied, if there were out-of-limit values, and in which section of the operating range they are located. You should also state whether the measured values are covered by the declared measurement and calibration capability, and if applicable, which area should be considered restricted. Do not state what was not found. Do not mention searches, internal processes, manuals, errors, cross validations or sources. Do not repeat formulas or closures. End with a specific statement as to whether the instrument can be used and under what conditions. Use a natural tone as a technician's recommendation to the customer, without redundancies. Treat any json_data as context only and do not refer to analysis steps or sources. Format the output in Markdown with clear paragraph breaks; use bold for key operational facts and italics for nuanced conditions; do not include headings, lists, tables, labels, or code blocks.`}
        onSave={async ({ clientFeedback, revisionComment, justificationComment }) => {
          try {
            setIsSubmitting(true);
            const response = await fetch('/api/validation/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cert_no: certNo, client_feedback: clientFeedback, revision_comment: revisionComment, justification_comment: justificationComment })
            });
            const data = await response.json();
            if (response.ok) {
              const calibrationId = data?.data?.CalibrationId ?? data?.data?.calibration_id ?? null;
              toast({ title: 'Validation recorded', description: `Certificate ${certNo} has been approved (Calibration ID: ${calibrationId ?? 'N/A'}).` });
              setValidationStatus(data.data);
              setShowRecommendation(false);
            } else {
              // Show detailed error information
              const errorTitle = data.error?.includes('Phoenix') ? "Phoenix Approval Failed" : "Approval Error";
              const errorDescription = data.error || 'Failed to approve report';
              
              toast({ 
                title: errorTitle, 
                description: errorDescription, 
                variant: 'destructive',
                duration: 8000 // Show longer for important errors
              });
            }
          } catch (err) {
            console.error('Error approving report:', err);
            toast({ title: 'Error', description: 'Failed to approve report', variant: 'destructive' });
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </>
  );
}
