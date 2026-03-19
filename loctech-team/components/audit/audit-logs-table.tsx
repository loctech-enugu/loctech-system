"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SpinnerLoader } from "@/components/spinner";

async function fetchAuditLogs(filters: {
  action?: string;
  resource?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters.action) params.set("action", filters.action);
  if (filters.resource) params.set("resource", filters.resource);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  const res = await fetch(`/api/audit-logs?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  const data = await res.json();
  return data.data ?? { logs: [], total: 0 };
}

export default function AuditLogsTable() {
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter, resourceFilter, page],
    queryFn: () =>
      fetchAuditLogs({
        action: actionFilter || undefined,
        resource: resourceFilter || undefined,
        limit,
        offset: page * limit,
      }),
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return (
      <SpinnerLoader
        title="Loading"
        message="Fetching audit logs..."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
        <Input
          placeholder="Filter by resource..."
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No audit logs found. Audit logging is recorded when createAuditLog is called from controllers.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: {
                id: string;
                userName?: string;
                userEmail?: string;
                action: string;
                resource: string;
                resourceId?: string;
                details?: Record<string, unknown>;
                createdAt: string;
              }) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.userName || log.userEmail || "-"}</p>
                      {log.userEmail && (
                        <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{log.resourceId || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details).slice(0, 80) + "..." : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {total > limit && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * limit >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
