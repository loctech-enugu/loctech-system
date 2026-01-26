"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";

import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Copy,
  BookOpen,
  User2,
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

import { Student } from "@/types";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import DeleteStudent from "./delete-student";
import { DataTablePagination } from "../data-table-pagination";
import GeneratePassword from "./generate-password";

interface StudentsTableProps {
  students: Student[];
  onStudentEdited?: (student: Student) => void;
}

const formatDate = (date: string | Date | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function StudentsTable({
  students,
  onStudentEdited,
}: StudentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [deleting, setDeleting] = React.useState<Student | null>(null);
  const { isOpen, onOpenChange, onOpen } = useDisclosure();
  const { data: session } = useSession();

  const onStudentDeleted = React.useCallback(
    (student: Student) => {
      setDeleting(student);
      onOpen();
    },
    [onOpen]
  );

  const columns = React.useMemo<ColumnDef<Student>[]>(
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
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.getValue("email") || "-",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.getValue("phone") || "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const color =
            status === "active"
              ? "bg-green-100 text-green-800"
              : status === "graduated"
                ? "bg-blue-100 text-blue-800"
                : status === "pending"
                  ? "bg-gray-100 text-gray-800"
                  : status === "suspended"
                    ? "bg-red-100 text-red-800"
                    : "bg-red-100 text-red-800";

          return <Badge className={color}>{status}</Badge>;
        },
      },
      {
        accessorKey: "nextOfKin",
        header: "Next of Kin",
        cell: ({ row }) => {
          const kin = row.original.nextOfKin;
          if (!kin) return "-";
          return (
            <div className="flex flex-col">
              <span className="font-medium">{kin.name}</span>
              <span className="text-sm text-muted-foreground">
                {kin.relationship || "N/A"}
              </span>
              <span className="text-sm text-muted-foreground">
                {kin.contact}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "highestQualification",
        header: "Qualification",
        cell: ({ row }) => row.getValue("highestQualification") || "-",
      },
      {
        accessorKey: "nationality",
        header: "Nationality",
        cell: ({ row }) => row.getValue("nationality") || "-",
      },
      {
        accessorKey: "heardFrom",
        header: "Heard From",
        cell: ({ row }) => row.getValue("heardFrom") || "-",
      },
      {
        accessorKey: "courses",
        header: "Courses",
        cell: ({ row }) => {
          const courses = row.original.courses || [];
          return (
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{courses.length}</span>
            </div>
          );
        },
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
          const student = row.original;
          return (
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
                    navigator.clipboard.writeText(student.name);
                    toast.success("Student name copied");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStudentEdited?.(student)}>
                  Edit student
                </DropdownMenuItem>
                {session && session.user.role === "super_admin" && (
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onStudentDeleted(student)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete student
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onStudentDeleted, onStudentEdited, session]
  );

  const table = useReactTable({
    data: students ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });
  const hasNoPassword = students?.some((student) => !student.hasPassword);
  // console.log(hasNoPassword, students);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter by student name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("name")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex gap-2">
          {hasNoPassword && <GeneratePassword />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
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
      </div>

      <div className="overflow-hidden rounded-md border">
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
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="pt-4">
        <DataTablePagination table={table} />
      </div>

      <DeleteStudent
        student={deleting}
        open={isOpen}
        onOpenChange={onOpenChange}
      />
    </div>
  );
}
