"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsData } from "../types/results.types";

interface RawDataViewerProps {
  results: ResultsData;
}

export function RawDataViewer({ results }: RawDataViewerProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold leading-none">Complete Response (Processed Results)</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Raw validation results as received from the backend
          </p>
        </CardHeader>
        <CardContent>
          {results ? (
            <div className="rounded-lg border border-border bg-muted/30 p-1">
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[70vh] font-mono leading-relaxed">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground font-medium">No complete JSON data to display.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 