"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Search, Calendar, Building, Wrench, CheckCircle, AlertTriangle, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Certificate {
  cert_no: string;
  created_at: string;
  overall_status: string;
  manufacturer?: string;
  model?: string;
  equipment_type?: string;
  customer_name?: string;
  calibrated_by?: string;
  requirements_pass?: boolean | null;
  cmc_pass?: boolean | null;
  tolerance_pass?: string | null;
  openai_summary?: string | null;
}

interface CertificateSelectorProps {
  onCertificateSelect?: (certNo: string) => void;
  selectedCertNo?: string;
}

export function CertificateSelector({ onCertificateSelect, selectedCertNo }: CertificateSelectorProps) {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Certificate>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/certificates/list?all=true');
      const data = await response.json();
      
      if (data.success) {
        setCertificates(data.certificates || []);
      } else {
        setError(data.error || 'Failed to load certificates');
      }
    } catch (err) {
      setError('Failed to fetch certificates');
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  let filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.cert_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cert.overall_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Apply Pending Review switch by removing certs that are validated
  // We do this fetch client-side to keep implementation simple
  const [validatedSet, setValidatedSet] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!showPendingOnly) return setValidatedSet(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/validation/cert-nos');
        const json = await res.json();
        if (!cancelled && res.ok && json.success) {
          setValidatedSet(new Set<string>(json.certNos || []));
        }
      } catch {
        if (!cancelled) setValidatedSet(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, [showPendingOnly]);

  if (showPendingOnly && validatedSet) {
    filteredCertificates = filteredCertificates.filter(c => !validatedSet.has(c.cert_no));
  }

  // Apply sorting like Overview
  filteredCertificates.sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return 0;
  });

  // Pagination slice
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCertificates.length);
  const currentCertificates = filteredCertificates.slice(startIndex, endIndex);

  // Reset to first page when filters or sorting change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  const statusConfig = {
    PASS: { icon: CheckCircle, className: 'text-emerald-600 dark:text-emerald-400' },
    FAIL: { icon: AlertTriangle, className: 'text-destructive' },
    ATTENTION: { icon: Clock, className: 'text-amber-600 dark:text-amber-400' },
    PROCESSING: { icon: Clock, className: 'text-sky-600 dark:text-sky-400' },
  } as const;

  const getStatusBadge = (status: string) => {
    const key = (status || 'PROCESSING') as keyof typeof statusConfig;
    const Icon = statusConfig[key]?.icon || Clock;
    const className = statusConfig[key]?.className || statusConfig.PROCESSING.className;
    return (
      <span className="inline-flex items-center gap-2">
        <Icon className={`h-4 w-4 ${className}`} aria-hidden="true" />
        <span className="text-xs font-medium text-foreground">{status || 'Unknown'}</span>
      </span>
    );
  };

  const handleViewReport = (certNo: string) => {
    if (onCertificateSelect) {
      onCertificateSelect(certNo);
    } else {
      router.push(`/dashboard/report-viewer/${encodeURIComponent(certNo)}`);
    }
  };

  const uniqueStatuses = Array.from(new Set(certificates.map(cert => cert.overall_status).filter(Boolean)));

  if (loading) {
    return (
      <Card className="shadow-xs">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground/40 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading certificates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xs border-destructive">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-destructive font-medium mb-2">Error Loading Certificates</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCertificates} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div>
          <CardTitle>Certificate Database</CardTitle>
          <CardDescription>
            {filteredCertificates.length} certificates found
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by certificate number, manufacturer, model, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-muted focus:bg-muted transition-colors"
            />
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-2">
              <Switch checked={showPendingOnly} onCheckedChange={setShowPendingOnly} />
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="font-medium"
            >
              All
            </Button>
            {uniqueStatuses.map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="font-medium"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count removed to avoid duplication with header */}

        {/* Certificates Table (Overview style) */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'No certificates match your search criteria.' 
                : 'No certificates available.'}
            </p>
          </div>
        ) : (
          <div>
            <div className="rounded-lg border bg-background">
              <Table className="[&_th]:h-10 [&_th]:px-2 [&_td]:px-2 [&_td]:py-2 [&_th:first-child]:pl-12 [&_td:first-child]:pl-12">
                <TableHeader>
                  <TableRow>
                    <TableHead className="!pl-12">
                      <DataTableColumnHeader
                        title="Certificate"
                        sortField="cert_no"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, direction) => {
                          setSortField(field as keyof Certificate);
                          setSortDirection(direction);
                        }}
                      />
                    </TableHead>
                    <TableHead>
                      <DataTableColumnHeader
                        title="Status"
                        sortField="overall_status"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, direction) => {
                          setSortField(field as keyof Certificate);
                          setSortDirection(direction);
                        }}
                      />
                    </TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>
                      <DataTableColumnHeader
                        title="Date"
                        sortField="created_at"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, direction) => {
                          setSortField(field as keyof Certificate);
                          setSortDirection(direction);
                        }}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCertificates.map((cert) => (
                  <TableRow key={cert.cert_no} className="transition-colors hover:bg-muted/30" onClick={() => handleViewReport(cert.cert_no)}>
                    <TableCell className="!pl-12 font-medium">
                      <TooltipProvider delayDuration={80}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{cert.cert_no}</span>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="start" className="max-w-[320px] sm:max-w-[420px] text-[11px] sm:text-xs">
                            <div className="space-y-2">
                              <div className="font-semibold">Certificate</div>
                              <div className="font-mono text-xs break-all">{cert.cert_no}</div>
                              <div className="font-semibold pt-1">Statuses</div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <span className="text-muted-foreground">Requirements</span>
                                <span className="font-medium">{cert.requirements_pass === true ? 'PASS' : cert.requirements_pass === false ? 'FAIL' : 'N/A'}</span>
                                <span className="text-muted-foreground">CMC</span>
                                <span className="font-medium">{cert.cmc_pass === true ? 'PASS' : cert.cmc_pass === false ? 'FAIL' : 'N/A'}</span>
                                <span className="text-muted-foreground">Tolerance</span>
                                <span className="font-medium">{cert.tolerance_pass ?? 'N/A'}</span>
                              </div>
                              {cert.openai_summary && (
                                <div className="pt-2">
                                  <div className="font-semibold">AI Summary</div>
                                  <div className="text-muted-foreground whitespace-pre-wrap break-words line-clamp-6">{cert.openai_summary}</div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider delayDuration={80}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div onClick={(e) => e.stopPropagation()}>{getStatusBadge(cert.overall_status)}</div>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="start" className="max-w-[320px] sm:max-w-[420px] text-[11px] sm:text-xs">
                            <div className="space-y-2">
                              <div className="font-semibold">Certificate</div>
                              <div className="font-mono text-xs break-all">{cert.cert_no}</div>
                              <div className="font-semibold pt-1">Statuses</div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <span className="text-muted-foreground">Requirements</span>
                                <span className="font-medium">{cert.requirements_pass === true ? 'PASS' : cert.requirements_pass === false ? 'FAIL' : 'N/A'}</span>
                                <span className="text-muted-foreground">CMC</span>
                                <span className="font-medium">{cert.cmc_pass === true ? 'PASS' : cert.cmc_pass === false ? 'FAIL' : 'N/A'}</span>
                                <span className="text-muted-foreground">Tolerance</span>
                                <span className="font-medium">{cert.tolerance_pass ?? 'N/A'}</span>
                              </div>
                              {cert.openai_summary && (
                                <div className="pt-2">
                                  <div className="font-semibold">AI Summary</div>
                                  <div className="text-muted-foreground whitespace-pre-wrap break-words line-clamp-6">{cert.openai_summary}</div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cert.manufacturer}</div>
                          <div className="text-sm text-muted-foreground">{cert.model}</div>
                          <div className="text-xs text-muted-foreground">{cert.equipment_type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cert.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{cert.calibrated_by}</div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {new Date(cert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {endIndex} of {filteredCertificates.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm tabular-nums">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}