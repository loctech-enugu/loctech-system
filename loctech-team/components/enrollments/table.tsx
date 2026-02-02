"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  VisibilityState,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  UserCheck,
  UserX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Enrollment } from "@/types";
import { toast } from "sonner";
import { DataTablePagination } from "../data-table-pagination";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SpinnerLoader } from "../spinner";

interface EnrollmentsTableProps {
  classId?: string;
  studentId?: string;
}

async function fetchEnrollments(classId?: string, studentId?: string) {
  let url = "/api/enrollments";
  if (classId) {
    url = `/api/enrollments/class/${classId}`;
  } else if (studentId) {
    url = `/api/enrollments/student/${studentId}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  const data = await res.json();
  return data.data || [];
}

async function updateEnrollmentStatus(
  enrollmentId: string,
  status: string,
  pauseReason?: string
) {
  const res = await fetch(`/api/enrollments/${enrollmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, pauseReason }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update enrollment");
  }
  return res.json();
}

export function EnrollmentsTable({
  classId,
  studentId,
}: EnrollmentsTableProps) {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments", classId, studentId],
    queryFn: () => fetchEnrollments(classId, studentId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      enrollmentId,
      status,
      pauseReason,
    }: {
      enrollmentId: string;
      status: string;
      pauseReason?: string;
    }) => updateEnrollmentStatus(enrollmentId, status, pauseReason),
    onSuccess: () => {
      toast.success("Enrollment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update enrollment");
    },
  });

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const columns = React.useMemo<ColumnDef<Enrollment>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "student",
        header: "Student",
        cell: ({ row }) => {
          const student = row.original.student;
          return student ? (
            <div className="flex flex-col">
              <span className="font-medium">{student.name}</span>
              <span className="text-sm text-muted-foreground">
                {student.email}
              </span>
            </div>
          ) : (
            <span>-</span>
          );
        },
      },
      {
        accessorKey: "class",
        header: "Class",
        cell: ({ row }) => {
          const classItem = row.original.class;
          return classItem ? (
            <span className="font-medium">{classItem.name}</span>
          ) : (
            <span>-</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return status === "active" ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : status === "paused" ? (
            <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
          ) : status === "completed" ? (
            <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
          ) : (
            <Badge className="bg-gray-200 text-gray-800">Dropped</Badge>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => formatDate(row.getValue("startDate")),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const enrollment = row.original;
          const status = enrollment.status;

          return (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {status === "active" && (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({
                        enrollmentId: enrollment.id,
                        status: "paused",
                        pauseReason: "Manual pause",
                      })
                    }
                  >
                    <UserX className="mr-2 h-4 w-4" /> Pause
                  </DropdownMenuItem>
                )}
                {status === "paused" && (
                  <DropdownMenuItem
                    onClick={() =>
                      updateStatusMutation.mutate({
                        enrollmentId: enrollment.id,
                        status: "active",
                      })
                    }
                  >
                    <UserCheck className="mr-2 h-4 w-4" /> Resume
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      enrollmentId: enrollment.id,
                      status: "completed",
                    })
                  }
                >
                  Mark Complete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [updateStatusMutation]
  );

  const table = useReactTable({
    data: enrollments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) {
    return <SpinnerLoader title="Loading" message="Please wait while we load the enrollments data." />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by student name..."
          value={(table.getColumn("student")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("student")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto hidden md:flex">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden md:block overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No enrollments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
