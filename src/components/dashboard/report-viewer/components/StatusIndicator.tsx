"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusIndicatorProps } from "../types/results.types";

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5", 
  lg: "h-6 w-6"
};

export function StatusIndicator({ status, isSkipped = false, size = 'md' }: StatusIndicatorProps) {
  const getStatusIcon = () => {
    if (isSkipped) {
      return <HelpCircle className={cn(sizeClasses[size], "text-muted-foreground opacity-60")} />;
    }
    switch (status) {
      case 'PASS':
        return <CheckCircle className={cn(sizeClasses[size], "text-foreground opacity-70")} />;
      case 'FAIL':
        return <AlertTriangle className={cn(sizeClasses[size], "text-foreground opacity-70")} />;
      case 'ATTENTION':
        return <Clock className={cn(sizeClasses[size], "text-foreground opacity-70")} />;
      default:
        return <HelpCircle className={cn(sizeClasses[size], "text-muted-foreground")} />;
    }
  };

  const getStatusVariant = () => {
    if (isSkipped) return "outline";
    switch (status) {
      case 'PASS': return "default";
      case 'FAIL': return "destructive";
      case 'ATTENTION': return "default";
      default: return "outline";
    }
  };

  return (
    <Badge variant={getStatusVariant()} className="flex items-center gap-1 px-1.5">
      {getStatusIcon()}
      <span>{status}</span>
    </Badge>
  );
} 