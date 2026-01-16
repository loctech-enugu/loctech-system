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
  Copy,
  Users,
  Calendar,
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

import { useSession } from "next-auth/react";
import { Course } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { userLinks } from "@/lib/utils";
import { DataTablePagination } from "../data-table-pagination";
import GoogleDriveIcon from "./google-drive-icon";

interface CountedCourses extends Course {
  count: string;
}

interface CoursesTableProps {
  courses: CountedCourses[];
  onCourseEdited?: (course: Course) => void;
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function CoursesTable({ courses, onCourseEdited }: CoursesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const { data: session } = useSession();

  const columns = React.useMemo<ColumnDef<CountedCourses>[]>(
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
        accessorKey: "count",
        header: ({ column }) => (
          <span
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center cursor-pointer"
          >
            # <ArrowUpDown className="ml-2 h-4 w-4" />
          </span>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{row.getValue("count")}</span>
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.getValue("title")}</span>,
      },
      {
        accessorKey: "instructor",
        header: "Instructor",
        cell: ({ row }) => {
          const instructor = row.original.instructor;
          return instructor ? (
            <div className="flex flex-col">
              <span className="font-medium">{instructor.name}</span>
              <a
                href={`mailto:${instructor.email}`}
                className="text-sm text-muted-foreground"
              >
                {instructor.email}
              </a>
            </div>
          ) : (
            <span>-</span>
          );
        },
      },
      {
        accessorKey: "students",
        header: "Students",
        cell: ({ row }) => {
          const students = row.original.students || [];
          return (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{students.length}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Price",
        cell: ({ row }) => (
          <span>₦{Number(row.getValue("amount")).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.getValue("isActive") ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge className="bg-gray-200 text-gray-800">Inactive</Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.getValue("createdAt")),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const course = row.original;
          return (
            <div className="flex gap-2">
              <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                <Link
                  href={course.curriculumUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GoogleDriveIcon />
                </Link>
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(course.courseRefId);
                      toast.success("Course code copied");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy code
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {session && session.user.role !== "staff" && (
                    <DropdownMenuItem onClick={() => onCourseEdited?.(course)}>
                      Edit course
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={userLinks.schedule(course.id)}>
                      View Schedule
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={userLinks.attendance.students(course.id)}>
                      View Attendance
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onCourseEdited, session]
  );

  const table = useReactTable({
    data: courses ?? [],
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

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by course title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
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

      {/* <div className="overflow-hidden rounded-md border"> */}
      <div className="hidden md:block overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
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
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <DataTablePagination table={table} />
      </div>

      {/* Mobile List View */}
      <div className="block md:hidden space-y-3">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const c = row.original;
            return (
              <div
                key={row.id}
                className="border rounded-lg p-3 bg-card shadow-sm space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base">{c.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {c.instructor?.name || "—"}
                    </p>
                  </div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(c.courseRefId);
                          toast.success("Course code copied");
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy code
                      </DropdownMenuItem>
                      {session && session.user.role !== "staff" && (
                        <DropdownMenuItem onClick={() => onCourseEdited?.(c)}>
                          Edit course
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={userLinks.schedule(c.id)}>
                          <Calendar className="mr-2 h-4 w-4" /> View Schedule
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={userLinks.attendance.students(c.id)}>
                          View Attendance
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-sm flex flex-wrap gap-3 text-muted-foreground">
                  <span>₦{Number(c.amount).toLocaleString()}</span>•
                  <span>{c.students?.length || 0} students</span>•
                  <span>{formatDate(c.createdAt)}</span>
                </div>

                <Badge
                  className={`${
                    c.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            );
          })
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No courses found.
          </p>
        )}
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
