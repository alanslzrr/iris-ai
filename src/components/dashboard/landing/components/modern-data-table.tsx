"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { usePhoenixLiveSet } from "@/hooks/usePhoenixLiveSet";
import { usePreferencesStore } from "@/stores/preferences/preferences-store";
import { useValidatedCertNos } from "@/hooks/useValidatedCertNos";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from 'react-day-picker';
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

interface Certificate {
  cert_no: string;
  status: string;
  created_at: string;
  manufacturer: string;
  model: string;
  equipment_type: string;
  overall_status: string;
  customer_name: string;
  calibrated_by: string;
  requirements_pass?: boolean | null;
  cmc_pass?: boolean | null;
  tolerance_pass?: string | null;
  openai_summary?: string | null;
  openai_services?: string[];
}

const statusConfig = {
  PASS: {
    label: "Pass",
    variant: "default" as const,
    icon: CheckCircle,
    className: "text-green-600 dark:text-green-400",
  },
  FAIL: {
    label: "Fail",
    variant: "destructive" as const,
    icon: AlertTriangle,
    className: "text-red-600 dark:text-red-400",
  },
  ATTENTION: {
    label: "Attention",
    variant: "secondary" as const,
    icon: Clock,
    className: "text-yellow-600 dark:text-yellow-400",
  },
  PROCESSING: {
    label: "Processing",
    variant: "outline" as const,
    icon: Clock,
    className: "text-blue-600 dark:text-blue-400",
  },
};

interface ModernDataTableProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function ModernDataTable({ dateRange: controlledDateRange, onDateRangeChange }: ModernDataTableProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Certificate>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { liveOnly, setLiveOnly } = usePreferencesStore();
  const [uncontrolledDateRange, setUncontrolledDateRange] = useState<DateRange | undefined>();
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();
  const dateRange = useMemo(() => (
    typeof onDateRangeChange === 'function' ? controlledDateRange : uncontrolledDateRange
  ), [controlledDateRange, uncontrolledDateRange, onDateRangeChange]);

  const setDateRange = (range: DateRange | undefined) => {
    if (typeof onDateRangeChange === 'function') {
      onDateRangeChange(range);
    } else {
      setUncontrolledDateRange(range);
    }
  };

  const { set: phoenixSet, loading: liveLoading } = usePhoenixLiveSet();
  const { set: validatedSet } = useValidatedCertNos();
  
  const itemsPerPage = 10;

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/certificates/list?all=true');
      const data = await response.json();
      
      if (data.success) {
        setCertificates(data.certificates || []);
        setFilteredCertificates(data.certificates || []);
      } else {
        setError(data.error || 'Failed to fetch certificates');
      }
    } catch (err) {
      setError('Failed to fetch certificates');
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Phoenix set is prefetched globally via hook cache for snappy toggling

  useEffect(() => {
    let filtered = certificates;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.cert_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.equipment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.customer_name && cert.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cert => cert.overall_status === statusFilter);
    }

    // Apply date range filter (created_at)
    if (dateRange && (dateRange.from || dateRange.to)) {
      const start = dateRange.from ? new Date(dateRange.from) : null;
      let end = dateRange.to ? new Date(dateRange.to) : null;
      if (start) start.setHours(0, 0, 0, 0);
      // If only a single day is selected, treat it as that full day
      if (!end && start) end = new Date(start);
      if (end) end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(cert => {
        const created = new Date(cert.created_at);
        if (Number.isNaN(created.getTime())) return false;
        if (start && created < start) return false;
        if (end && created > end) return false;
        return true;
      });
    }

    // Apply Live filter by intersecting with Phoenix current certificates
    if (liveOnly && phoenixSet) {
      const normalize = (s: string) => (s || '').toString().trim().toUpperCase();
      filtered = filtered.filter(cert => phoenixSet.has(normalize(cert.cert_no)));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

    setFilteredCertificates(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [certificates, searchTerm, statusFilter, dateRange, sortField, sortDirection, liveOnly, phoenixSet]);

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PROCESSING;
    const Icon = config.icon;
    
    return (
      <span className="inline-flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.className}`} aria-hidden="true" />
        <span className="text-xs font-medium text-foreground">{status}</span>
      </span>
    );
  };

  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCertificates = filteredCertificates.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card className="@container/card shadow-xs">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Certificates</CardTitle>
          </div>
          <CardDescription className="text-destructive/80">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button 
            onClick={fetchCertificates}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Certificate Database</CardTitle>
            <CardDescription>
              {filteredCertificates.length} certificates found
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCertificates} className="shadow-xs">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PASS">Pass</SelectItem>
              <SelectItem value="FAIL">Fail</SelectItem>
              <SelectItem value="ATTENTION">Attention</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="shadow-xs justify-start">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span>{format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}</span>
                  ) : (
                    <span>{format(dateRange.from, 'MMM dd, yyyy')}</span>
                  )
                ) : (
                  <span>Date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={(() => {
                    if (dateRange?.from && !dateRange?.to && hoveredDate) {
                      const from = dateRange.from;
                      const to = hoveredDate;
                      return from <= to ? { from, to } : { from: to, to: from };
                    }
                    return dateRange;
                  })()}
                  onSelect={setDateRange}
                  onDayMouseEnter={(date) => setHoveredDate(date)}
                  onDayMouseLeave={() => setHoveredDate(undefined)}
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} disabled={!dateRange?.from && !dateRange?.to}>Clear</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <Switch checked={liveOnly} onCheckedChange={setLiveOnly} />
                <span className="text-sm text-muted-foreground">Live{liveOnly && !phoenixSet ? ' (loading...)' : ''}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <p>On: show only certificates present in Phoenix (Live) and evaluated. Off: show full history.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Table - reference styling (header row, tighter cells, muted hover) */}
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
                <TableRow key={cert.cert_no} className="transition-colors hover:bg-muted/30">
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
                          <div>{getStatusBadge(cert.overall_status)}</div>
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
                    {format(new Date(cert.created_at), 'MMM dd, yyyy')}
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCertificates.length)} of {filteredCertificates.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="shadow-xs"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 