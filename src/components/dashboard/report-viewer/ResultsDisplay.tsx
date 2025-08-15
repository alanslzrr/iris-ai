"use client";

import { useState } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { usePreferencesStore } from "@/stores/preferences/preferences-store";
import { ResultsData } from "./types/results.types";
import { useResultsData } from "./hooks/useResultsData";
import { useServiceStatus } from "./hooks/useServiceStatus";
import { StatusIndicator } from "./components/StatusIndicator";
import { ServiceCard } from "./components/ServiceCard";
import { ServiceDetailLayout } from "./components/ServiceDetailLayout";
import { RawDataViewer } from "./components/RawDataViewer";
import { RequirementsSection } from "./components/RequirementsSection";
import { CmcValidationSection } from "./components/CmcValidationSection";
import { ToleranceSection } from "./components/ToleranceSection";
import { AiAnalysisSection } from "./components/AiAnalysisSection";
import { ValidationButtons } from "./components/ValidationButtons";

interface ResultsDisplayProps {
  results: ResultsData;
}

// Next.js font loaders must be called at module scope
const rvFont = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','500','600','700'], display: 'swap' });

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const { sidebarVariant, contentLayout } = usePreferencesStore();
  
  const { 
    requirementsPassFlag, 
    calculateRequirementsPass,
    formatPassFlag, 
    hasServiceData, 
    overallStatus, 
    tabs 
  } = useResultsData(results);
  
  const { getStatusColor, getStatusIcon, getServiceStatusIcon, getEvaluationStatusBadge } = useServiceStatus(results);

  if (!results) {
    return (
      <Card className="shadow-xs">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No validation results to display.</p>
        </CardContent>
      </Card>
    );
  }

  const filteredTabs = tabs.filter(tab => 
    tab.id === 'summary' || 
    tab.id === 'raw' || 
    (tab.dataKey && hasServiceData(tab.dataKey))
  );

  return (
    <div className={`@container/main flex flex-col gap-4 md:gap-6 rv-theme rv-typography ${rvFont.className}`}>
      {/* Header */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-2xl font-semibold leading-none">Validation Results</CardTitle>
              <CardDescription className="mt-2 text-sm">
                Certificate: <span className="font-mono font-medium">{results.source_certificate?.certNo || 'Unknown'}</span>
                {results.source_certificate?.originalFilename && (
                  <span className="block mt-1 truncate">
                    File: {results.source_certificate.originalFilename}
                  </span>
                )}
                {results.evaluation_status && results.evaluation_status !== 'not_checked' && (
                  <Badge 
                    variant={getEvaluationStatusBadge(results.evaluation_status).variant}
                    className={`mt-2 ${getEvaluationStatusBadge(results.evaluation_status).className}`}
                  >
                    {getEvaluationStatusBadge(results.evaluation_status).text}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(overallStatus, false)}`}>
              {getStatusIcon(overallStatus, false)}
              <span className="tracking-wide">{overallStatus}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
        <TabsList className={`grid w-full ${
          filteredTabs.length === 5 ? 'grid-cols-5' : 
          filteredTabs.length === 4 ? 'grid-cols-4' : 
          filteredTabs.length === 3 ? 'grid-cols-3' : 
          'grid-cols-2'
        }`}>
          {filteredTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="font-medium data-[state=active]:bg-accent/40 data-[state=active]:text-foreground data-[state=active]:shadow-xs">
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="flex flex-col gap-6">
          <div className="grid gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            <ServiceCard
              title="Requirements Validation"
              status="PASS"
              passFlag={requirementsPassFlag}
              serviceName="validate_requeirments"
              results={results}
            />
            <ServiceCard
              title="CMC Validation"
              status="PASS"
              passFlag={results.summary?.cmc_pass ?? null}
              serviceName="cmc_validate_agents"
              results={results}
            />
            <ServiceCard
              title="Tolerance Validation"
              status="PASS"
              passFlag={results.summary?.tolerance_pass ?? null}
              serviceName="validate_tolerance"
              results={results}
            />
          </div>
          
          {/* Processed Certificate Information */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-semibold leading-none">Processed Certificate Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">Certificate Number</dt>
                  <dd className="text-foreground font-mono">{results.source_certificate?.certNo || 'N/A'}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">Processing Date</dt>
                  <dd className="text-foreground font-medium">
                    {results.source_certificate?.timestamp 
                      ? new Date(results.source_certificate.timestamp).toLocaleString()
                      : 'N/A'
                    }
                  </dd>
                </div>
                {results.source_certificate?.originalFilename && (
                  <div className="space-y-1 md:col-span-2">
                    <dt className="text-xs text-muted-foreground">Original Filename</dt>
                    <dd className="text-foreground font-medium truncate">{results.source_certificate.originalFilename}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          
          {/* AI Analysis Section */}
          <AiAnalysisSection results={results} />
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="flex flex-col gap-6">
          <ServiceDetailLayout
            serviceName="Requirements Validation"
            serviceData={results.validate_requeirments}
            passFlag={requirementsPassFlag}
            getServiceStatusIcon={getServiceStatusIcon}
          >
            <RequirementsSection serviceData={results.validate_requeirments} />
          </ServiceDetailLayout>
        </TabsContent>

        {/* CMC Tab */}
        <TabsContent value="cmc" className="flex flex-col gap-6">
          <ServiceDetailLayout
            serviceName="CMC Validation"
            serviceData={results.cmc_validate_agents}
            passFlag={results.summary?.cmc_pass ?? null}
            getServiceStatusIcon={getServiceStatusIcon}
          >
            <CmcValidationSection serviceData={results.cmc_validate_agents} />
          </ServiceDetailLayout>
        </TabsContent>

        {/* Tolerance Tab */}
        <TabsContent value="tolerance" className="flex flex-col gap-6">
          <ServiceDetailLayout
            serviceName="Tolerance Validation"
            serviceData={results.validate_tolerance}
            passFlag={results.summary?.tolerance_pass ?? null}
            getServiceStatusIcon={getServiceStatusIcon}
          >
            <ToleranceSection serviceData={results.validate_tolerance} />
          </ServiceDetailLayout>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw" className="flex flex-col gap-6">
          <RawDataViewer results={results} />
        </TabsContent>
      </Tabs>

      {/* Validation Buttons */}
      <ValidationButtons certNo={results.source_certificate?.certNo || 'Unknown'} />
    </div>
  );
} 