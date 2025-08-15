"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { CheckCircle, AlertTriangle, Search, RefreshCw, ArrowLeft, ArrowRight, Eye } from 'lucide-react';

type ValidationStatus = 'APPROVED' | 'REJECTED';

interface ValidatedRecord {
  cert_no: string;
  status: ValidationStatus;
  approved_by: string;
  approved_at: string;
  tolerance_errors?: { codes: string[]; another_reason?: string } | null;
  cmc_errors?: { codes: string[]; another_reason?: string } | null;
  requirements_errors?: { codes: string[]; another_reason?: string } | null;
}

export default function ValidatedPage() {
  const router = useRouter();

  const [records, setRecords] = useState<ValidatedRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ValidationStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof ValidatedRecord>('approved_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const pageSize = 25;

  const fetchValidated = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(currentPage));
      params.set('pageSize', String(pageSize));

      const response = await fetch(`/api/validation/list?${params.toString()}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setRecords(data.records || []);
        setTotalCount(Number(data.count || 0));
      } else {
        setError(data.error || 'Failed to load validated reports');
      }
    } catch (e) {
      setError('Failed to load validated reports');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, searchTerm]);

  const filteredAndSorted = useMemo(() => {
    const result = [...records];

    // Sort current page items
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortField === 'approved_at') {
        const aDate = new Date(String(aVal)).getTime();
        const bDate = new Date(String(bVal)).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return result;
  }, [records, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRows = filteredAndSorted;

  const statusBadge = (status: ValidationStatus) => {
    const isApproved = status === 'APPROVED';
    const Icon = isApproved ? CheckCircle : AlertTriangle;
    const text = isApproved ? 'Approved' : 'Rejected';
    const cls = isApproved
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
    return (
      <span className="inline-flex items-center gap-2">
        <Icon className={`h-4 w-4 ${cls}`} aria-hidden="true" />
        <span className="text-xs font-medium text-foreground">{text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8 px-4 lg:px-6">
          <Separator className="my-4 md:my-6" />
          <Card className="shadow-xs animate-pulse">
            <CardHeader>
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-4 w-60 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8 px-4 lg:px-6">
          <Separator className="my-4 md:my-6" />
          <Card className="border-destructive/50 shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-destructive">Error Loading Validated Reports</CardTitle>
                  <CardDescription className="text-destructive/80">{error}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchValidated}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8 px-4 lg:px-6">
        <Separator className="my-4 md:my-6" />

        {/* Table */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Validated Reports</CardTitle>
                <CardDescription>All human validations with audit details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by certificate or reviewer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('APPROVED');
                    setCurrentPage(1);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approved
                </Button>
                <Button
                  variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('REJECTED');
                    setCurrentPage(1);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" /> Rejected
                </Button>
              </div>
            </div>

            {/* Table - match existing styling */}
            <div className="rounded-lg border bg-background mt-4">
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
                          setSortField(field as keyof ValidatedRecord);
                          setSortDirection(direction);
                        }}
                      />
                    </TableHead>
                    <TableHead>
                      <DataTableColumnHeader
                        title="Status"
                        sortField="status"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, direction) => {
                          setSortField(field as keyof ValidatedRecord);
                          setSortDirection(direction);
                        }}
                      />
                    </TableHead>
                    <TableHead>
                      <DataTableColumnHeader
                        title="Reviewer"
                        sortField="approved_by"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, direction) => {
                          setSortField(field as keyof ValidatedRecord);
                          setSortDirection(direction);
                        }}
                      />
                    </TableHead>
                    <TableHead>
                      <DataTableColumnHeader
                        title="Validated At"
                        sortField="approved_at"
                        currentSortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, direction) => {
                          setSortField(field as keyof ValidatedRecord);
                          setSortDirection(direction);
                        }}
                      />
                    </TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRows.map((row) => (
                    <TableRow key={`${row.cert_no}-${row.approved_at}`} className="transition-colors hover:bg-muted/30">
                      <TableCell className="!pl-12 font-medium">{row.cert_no}</TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>{row.approved_by}</TableCell>
                      <TableCell className="tabular-nums">
                        {row.approved_at ? format(new Date(row.approved_at), 'MMM dd, yyyy HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        {row.status === 'REJECTED' ? (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {row.tolerance_errors?.codes?.length ? (
                              <div>
                                <span className="font-medium text-foreground/80">Tolerance:</span>{' '}
                                {row.tolerance_errors.codes.join(', ')}
                                {row.tolerance_errors.another_reason && (
                                  <span className="italic"> — "{row.tolerance_errors.another_reason}"</span>
                                )}
                              </div>
                            ) : null}
                            {row.cmc_errors?.codes?.length ? (
                              <div>
                                <span className="font-medium text-foreground/80">CMC:</span>{' '}
                                {row.cmc_errors.codes.join(', ')}
                                {row.cmc_errors.another_reason && (
                                  <span className="italic"> — "{row.cmc_errors.another_reason}"</span>
                                )}
                              </div>
                            ) : null}
                            {row.requirements_errors?.codes?.length ? (
                              <div>
                                <span className="font-medium text-foreground/80">Requirements:</span>{' '}
                                {row.requirements_errors.codes.join(', ')}
                                {row.requirements_errors.another_reason && (
                                  <span className="italic"> — "{row.requirements_errors.another_reason}"</span>
                                )}
                              </div>
                            ) : null}
                            {!row.tolerance_errors && !row.cmc_errors && !row.requirements_errors && (
                              <span>-</span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-accent/40 dark:bg-accent/20">No issues</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/report-viewer/${encodeURIComponent(row.cert_no)}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View
                        </Button>
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
                  Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} results
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
                  <span className="text-sm tabular-nums">Page {currentPage} of {totalPages}</span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


