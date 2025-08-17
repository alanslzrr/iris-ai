"use client";

import { ResultsDisplay } from '@/components/dashboard/report-viewer';
import { CertificateSelector } from '@/components/dashboard/report-viewer/components/CertificateSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ReportViewerMainPage() {
  const [selectedCertNo, setSelectedCertNo] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const fetchCertificateData = async (certNo: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/certificates/${encodeURIComponent(certNo)}/report`);
      const data = await response.json();
      
      if (data.success && data.json_data) {
        setResultsData(data.json_data);
        setReportUrl(data.certificate_info?.report_url || null);
      } else {
        setError(data.error || 'Failed to load certificate validation results');
        setResultsData(null);
        setReportUrl(null);
      }
    } catch (err) {
      setError('Failed to fetch certificate data');
      setResultsData(null);
      setReportUrl(null);
      console.error('Error fetching certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateSelect = (certNo: string) => {
    setSelectedCertNo(certNo);
    fetchCertificateData(certNo);
    
    // Update URL without navigation to maintain state
    window.history.pushState({}, '', `/dashboard/report-viewer/${encodeURIComponent(certNo)}`);
  };

  const handleGoBack = () => {
    setSelectedCertNo(null);
    setResultsData(null);
    setError(null);
    setReportUrl(null);
    window.history.pushState({}, '', '/dashboard/report-viewer');
  };

  const handleRefresh = () => {
    if (selectedCertNo) {
      fetchCertificateData(selectedCertNo);
    }
  };

  const handleOpenPdf = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank', 'noopener');
    }
  };

  // Check URL on mount to see if we have a certificate ID
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/dashboard\/report-viewer\/(.+)$/);
    if (match) {
      const certNo = decodeURIComponent(match[1]);
      setSelectedCertNo(certNo);
      fetchCertificateData(certNo);
    }
  }, []);

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="space-y-6 py-4 md:py-6 px-4 lg:px-6">
        {/* Minimal header (no titles, no extra spacing) */}
        {selectedCertNo && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenPdf} disabled={!reportUrl}>
                <FileText className="h-4 w-4 mr-2" />
                View PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Certificate Selector (shown when no certificate is selected) */}
        {!selectedCertNo && (
          <CertificateSelector 
            onCertificateSelect={handleCertificateSelect}
            selectedCertNo={selectedCertNo || undefined}
          />
        )}

        {/* Selected Certificate Content */}
        {selectedCertNo && (
          <>
            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading validation results...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="border-destructive">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-destructive font-medium mb-2">Error Loading Certificate</p>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleRefresh} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                      <Button onClick={handleGoBack} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Selection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Display */}
            {resultsData && !loading && !error && (
              <ResultsDisplay results={resultsData} />
            )}
            
            {/* No Data State */}
            {!resultsData && !loading && !error && selectedCertNo && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground">No validation results found for this certificate.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      The certificate may not have been processed yet or the validation data is not available.
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button onClick={handleGoBack} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Select Different Certificate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}