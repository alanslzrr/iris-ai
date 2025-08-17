"use client";
import { ResultsDisplay } from '@/components/dashboard/report-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ReportViewerPageProps {
  params: Promise<{
    certNo: string;
  }>;
}

export default function ReportViewerPage({ params }: ReportViewerPageProps) {
  const router = useRouter();
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certNo, setCertNo] = useState<string>('');
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  // Initialize certNo from params
  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params;
      setCertNo(decodeURIComponent(resolvedParams.certNo));
    };
    initParams();
  }, [params]);

  const fetchCertificateData = async () => {
    if (!certNo) return;
    
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
        setReportUrl(null);
      }
    } catch (err) {
      setError('Failed to fetch certificate data');
      setReportUrl(null);
      console.error('Error fetching certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certNo) {
      fetchCertificateData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certNo]);

  const handleGoBack = () => {
    router.push('/dashboard/report-viewer');
  };

  const handleRefresh = () => {
    fetchCertificateData();
  };

  const handleOpenPdf = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank', 'noopener');
    }
  };

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="space-y-6 py-4 md:py-6 px-4 lg:px-6">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Report Viewer
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenPdf} disabled={!reportUrl}>
              <FileText className="h-4 w-4 mr-2" />
              View PDF
            </Button>
          </div>
        </div>
        
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
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {resultsData && !loading && !error && (
          <ResultsDisplay results={resultsData} />
        )}
        
        {/* No Data State */}
        {!resultsData && !loading && !error && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground">No validation results found for this certificate.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  The certificate may not have been processed yet or the validation data is not available.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}