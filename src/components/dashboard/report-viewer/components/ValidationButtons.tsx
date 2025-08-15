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
import { ValidationRecord, RejectFormData } from '../types/validation.types';

interface ValidationButtonsProps {
  certNo: string;
}

export function ValidationButtons({ certNo }: ValidationButtonsProps) {
  const [validationStatus, setValidationStatus] = useState<ValidationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const checkValidationStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/validation/status?cert_no=${encodeURIComponent(certNo)}`);
      const data = await response.json();

      if (response.ok && data.validated) {
        setValidationStatus(data);
      } else {
        setValidationStatus(null);
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

  // Check validation status on component mount
  useEffect(() => {
    checkValidationStatus();
  }, [checkValidationStatus]);

  const handleApprove = async () => {
    const confirmed = window.confirm("Do you confirm you approve this report?");
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/validation/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cert_no: certNo }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Report approved successfully",
        });
        // Update local state
        setValidationStatus(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve report",
          variant: "destructive",
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
      const response = await fetch('/api/validation/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Report Rejected",
          description: `${data.message || "Report rejected and successfully logged"} (Certificate: ${certNo})`,
          action: (
            <ToastAction altText="View activity" onClick={() => router.push('/dashboard/activity')}>
              View activity
            </ToastAction>
          ),
        });
        // Update local state
        setValidationStatus(data.data);
        setShowRejectForm(false);
        // Redirigir a la lista de pendientes tras rechazo exitoso
        setTimeout(() => {
          router.push('/dashboard/certificates'); // Cambia esta ruta si tu lista de pendientes es diferente
        }, 500); // Pequeño delay para que el usuario vea la notificación
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
    return getStatusDisplay();
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
    </>
  );
}
