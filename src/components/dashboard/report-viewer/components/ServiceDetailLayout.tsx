"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { ServiceDetailLayoutProps } from "../types/results.types";

export function ServiceDetailLayout({ 
  serviceName, 
  serviceData, 
  passFlag, 
  getServiceStatusIcon, 
  children 
}: ServiceDetailLayoutProps) {
  if (!serviceData) {
    return (
      <Card className="shadow-xs">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground text-center">
            Data for the {serviceName} service not available or not yet processed.
          </p>
          {serviceData === null && (
            <p className="text-xs text-muted-foreground italic mt-2">
              The service may have been skipped or is pending.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (serviceData.skipped) {
    return (
      <Card className={`shadow-xs border-l-4 rounded-lg ${
        serviceData.templateValidated 
          ? 'border-border bg-accent/20'
          : 'border-border bg-muted'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {serviceData.templateValidated ? (
              <CheckCircle className="h-6 w-6 text-foreground opacity-70 mt-1 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-foreground opacity-70 mt-1 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base leading-none mb-2">
                {serviceData.templateValidated 
                  ? `${serviceName} Completed via Template`
                  : `Service Skipped: ${serviceName}`
                }
              </p>
              <p className="text-sm text-muted-foreground">{serviceData.reason || "This service was not executed."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (serviceData.error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10 shadow-xs rounded-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-foreground opacity-70 mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base leading-none mb-2">Error in Service: {serviceName}</p>
              <p className="text-sm text-muted-foreground">{serviceData.error || "An error occurred while processing this service."}</p>
              {serviceData.details && (
                <p className="text-xs mt-2 text-muted-foreground bg-muted/50 p-2 rounded-md">
                  Details: {typeof serviceData.details === 'object' ? JSON.stringify(serviceData.details) : serviceData.details}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h4 className="text-2xl font-semibold leading-none">{serviceName} Details</h4>
        <div className="flex items-center gap-2">
          {getServiceStatusIcon(serviceData.serviceNameKey || serviceName.toLowerCase().replace(/ /g, ''), passFlag)}
        </div>
      </div>
      {children}
      {/* Fallback if no specific children content and serviceData is just an object to dump */}
      {(!children && typeof serviceData === 'object' && Object.keys(serviceData).length > 0) && (
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <pre className="bg-muted/50 p-4 rounded-md text-xs overflow-auto max-h-96 border border-border font-mono">
              {JSON.stringify(serviceData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 