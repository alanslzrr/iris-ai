"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, Clock, ListTree, RefreshCw, Search, ShieldCheck, ShieldX, Table as TableIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type ValidationStatus = "APPROVED" | "REJECTED";

interface ValidationErrorDetail {
  codes: string[];
  another_reason?: string;
}

interface ActivityItem {
  cert_no: string;
  status: ValidationStatus;
  approved_by: string;
  approved_at: string;
  tolerance_errors?: ValidationErrorDetail | null;
  cmc_errors?: ValidationErrorDetail | null;
  requirements_errors?: ValidationErrorDetail | null;
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ValidationStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [sortField, setSortField] = useState<keyof ActivityItem>("approved_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));

      const response = await fetch(`/api/validation/list?${params.toString()}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setItems(data.records || []);
        setTotalCount(Number(data.count || 0));
      } else {
        setError(data.error || "Failed to load activity");
      }
    } catch (e) {
      setError("Failed to load activity");
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const filtered = useMemo(() => {
    const result = [...items];
    // Client sort for table view without roundtrip
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortField === "approved_at") {
        const aDate = new Date(String(aVal)).getTime();
        const bDate = new Date(String(bVal)).getTime();
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }
      const aStr = String(aVal ?? "").toLowerCase();
      const bStr = String(bVal ?? "").toLowerCase();
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return result;
  }, [items, sortField, sortDirection]);

  const approvedCount = filtered.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = filtered.filter((i) => i.status === "REJECTED").length;

  const handleExportCsv = () => {
    const header = [
      'approved_at',
      'approved_by',
      'status',
      'cert_no',
      'tolerance_codes',
      'tolerance_another_reason',
      'cmc_codes',
      'cmc_another_reason',
      'requirements_codes',
      'requirements_another_reason',
    ];
    const rows = filtered.map((r) => [
      r.approved_at ?? '',
      r.approved_by ?? '',
      r.status,
      r.cert_no,
      (r.tolerance_errors?.codes || []).join('|'),
      r.tolerance_errors?.another_reason || '',
      (r.cmc_errors?.codes || []).join('|'),
      r.cmc_errors?.another_reason || '',
      (r.requirements_errors?.codes || []).join('|'),
      r.requirements_errors?.another_reason || '',
    ]);
    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM dd, yyyy");
  };

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, ActivityItem[]>();
    for (const item of filtered) {
      const d = item.approved_at ? new Date(item.approved_at) : null;
      const key = d ? getDateLabel(d) : "Unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const StatusIcon = ({ status }: { status: ValidationStatus }) => {
    if (status === "APPROVED") {
      return <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />;
    }
    return <ShieldX className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />;
  };

  const StatusBadge = ({ status }: { status: ValidationStatus }) => (
    <Badge variant={status === "APPROVED" ? "secondary" : "destructive"} className={status === "APPROVED" ? "bg-green-500/15 text-green-600 dark:text-green-400" : ""}>
      {status === "APPROVED" ? "Approved" : "Rejected"}
    </Badge>
  );

  const renderRejectionDetails = (item: ActivityItem) => {
    if (item.status !== "REJECTED") return null;
    const rows: Array<{ label: string; data?: ValidationErrorDetail | null }> = [
      { label: "Tolerance", data: item.tolerance_errors },
      { label: "CMC", data: item.cmc_errors },
      { label: "Requirements", data: item.requirements_errors },
    ];

    const visible = rows.filter((r) => r.data && ((r.data.codes?.length ?? 0) > 0 || (r.data.another_reason && r.data.another_reason.trim() !== "")));
    if (visible.length === 0) return null;

    return (
      <div className="mt-2 text-xs text-muted-foreground space-y-1">
        {visible.map(({ label, data }) => (
          <div key={label}>
            <span className="font-medium text-foreground/80">{label}:</span>{" "}
            {data?.codes?.length ? data.codes.join(", ") : null}
            {data?.another_reason ? <span className="italic"> — "{data.another_reason}"</span> : null}
          </div>
        ))}
      </div>
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
                  <div key={i} className="h-16 bg-muted rounded" />
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
                  <CardTitle className="text-destructive">Error Loading Activity</CardTitle>
                  <CardDescription className="text-destructive/80">{error}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchActivity}>
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

        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Activity</CardTitle>
                <CardDescription>Latest approvals and rejections across the app</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "timeline" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                >
                  <ListTree className="h-4 w-4 mr-1" /> Timeline
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="h-4 w-4 mr-1" /> Table
                </Button>
                <Badge variant="secondary" className="bg-green-500/15 text-green-600 dark:text-green-400">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {approvedCount} approved
                </Badge>
                <Badge variant="destructive">
                  <ShieldX className="h-3.5 w-3.5 mr-1" /> {rejectedCount} rejected
                </Badge>
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  Export CSV
                </Button>
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
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "APPROVED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter("APPROVED");
                    setCurrentPage(1);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approved
                </Button>
                <Button
                  variant={statusFilter === "REJECTED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter("REJECTED");
                    setCurrentPage(1);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" /> Rejected
                </Button>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <Badge variant="secondary" className="bg-green-500/15 text-green-600 dark:text-green-400">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {approvedCount} approved
                </Badge>
                <Badge variant="destructive">
                  <ShieldX className="h-3.5 w-3.5 mr-1" /> {rejectedCount} rejected
                </Badge>
              </div>
            </div>

            {/* Content */}
            {viewMode === "timeline" ? (
              <div className="mt-6">
                {filtered.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No activity yet.</div>
                ) : (
                  <div className="space-y-8">
                    {groupedByDay.map(([label, rows]) => (
                      <div key={label}>
                        <div className="text-xs font-medium text-muted-foreground mb-3">{label}</div>
                        <ul className="relative border-l border-border/60 ml-2 pl-6 space-y-5">
                          {rows.map((item) => {
                            const date = item.approved_at ? new Date(item.approved_at) : null;
                            const initials = (item.approved_by || "?")
                              .split("@")[0]
                              .split(/[._-]/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((s) => s[0]?.toUpperCase())
                              .join("") || "?";
                            return (
                              <li key={`${item.cert_no}-${item.approved_at}`} className="relative">
                                <span className="absolute -left-[9px] top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-border">
                                  <StatusIcon status={item.status} />
                                </span>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-7 w-7 border">
                                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm">
                                      <span className="font-medium">{item.approved_by}</span>{" "}
                                      {item.status === "APPROVED" ? "approved" : "rejected"} report{" "}
                                      <Link href={`/dashboard/report-viewer/${encodeURIComponent(item.cert_no)}`} className="font-mono underline-offset-2 hover:underline">
                                        {item.cert_no}
                                      </Link>
                                      <span className="ml-2 inline-block align-middle">
                                        <StatusBadge status={item.status} />
                                      </span>
                                      {renderRejectionDetails(item)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {date ? (
                                      <span title={format(date, "MMM dd, yyyy HH:mm")}>{formatDistanceToNow(date, { addSuffix: true })}</span>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border bg-background">
                <Table className="[&_th]:h-10 [&_th]:px-2 [&_td]:px-2 [&_td]:py-2 [&_th:first-child]:pl-6 [&_td:first-child]:pl-6">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <DataTableColumnHeader
                          title="When"
                          sortField="approved_at"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field, direction) => {
                            setSortField(field as keyof ActivityItem);
                            setSortDirection(direction);
                          }}
                        />
                      </TableHead>
                      <TableHead>
                        <DataTableColumnHeader
                          title="User"
                          sortField="approved_by"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field, direction) => {
                            setSortField(field as keyof ActivityItem);
                            setSortDirection(direction);
                          }}
                        />
                      </TableHead>
                      <TableHead>
                        <DataTableColumnHeader
                          title="Action"
                          sortField="status"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field, direction) => {
                            setSortField(field as keyof ActivityItem);
                            setSortDirection(direction);
                          }}
                        />
                      </TableHead>
                      <TableHead>
                        <DataTableColumnHeader
                          title="Certificate"
                          sortField="cert_no"
                          currentSortField={sortField}
                          sortDirection={sortDirection}
                          onSort={(field, direction) => {
                            setSortField(field as keyof ActivityItem);
                            setSortDirection(direction);
                          }}
                        />
                      </TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                          No activity.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((row) => {
                        const date = row.approved_at ? new Date(row.approved_at) : null;
                        return (
                          <TableRow key={`${row.cert_no}-${row.approved_at}`} className="transition-colors hover:bg-muted/30">
                            <TableCell className="tabular-nums">
                              {date ? format(date, 'MMM dd, yyyy HH:mm') : '-'}
                            </TableCell>
                            <TableCell>{row.approved_by}</TableCell>
                            <TableCell>
                              {row.status === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <ShieldCheck className="h-4 w-4" /> Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
                                  <ShieldX className="h-4 w-4" /> Rejected
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link href={`/dashboard/report-viewer/${encodeURIComponent(row.cert_no)}`} className="font-mono underline-offset-2 hover:underline">
                                {row.cert_no}
                              </Link>
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
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  <span className="text-sm tabular-nums">Page {currentPage} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
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



