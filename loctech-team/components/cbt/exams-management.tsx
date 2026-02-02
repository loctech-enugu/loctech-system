"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useDisclosure } from "@/hooks/use-disclosure";
import CreateExam from "./create-exam";
import EditExam from "./edit-exam";
import { SpinnerLoader } from "../spinner";

async function fetchExams() {
  const res = await fetch("/api/exams");
  if (!res.ok) throw new Error("Failed to fetch exams");
  const data = await res.json();
  return data.data || [];
}

async function publishExam(examId: string, publish: boolean) {
  const res = await fetch(`/api/exams/${examId}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publish }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update exam");
  }
  return res.json();
}

export default function ExamsManagement() {
  const queryClient = useQueryClient();
  const { onOpen, onOpenChange, isOpen: isCreateOpen } = useDisclosure();
  const {
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
    isOpen: isEditOpen,
  } = useDisclosure();
  const [selectedExam, setSelectedExam] = React.useState<any>(null);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: fetchExams,
  });

  const publishMutation = useMutation({
    mutationFn: ({ examId, publish }: { examId: string; publish: boolean }) =>
      publishExam(examId, publish),
    onSuccess: () => {
      toast.success("Exam status updated");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update exam");
    },
  });

  const handleEdit = (exam: any) => {
    setSelectedExam(exam);
    onEditOpen();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-200 text-gray-800",
      published: "bg-green-100 text-green-800",
      ongoing: "bg-blue-100 text-blue-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[status] || "bg-gray-200 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return <SpinnerLoader title="Loading" message="Please wait while we load the exams data." />;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={onOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length > 0 ? (
              exams.map((exam: any) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.course?.title || "-"}</TableCell>
                  <TableCell>{exam.duration} min</TableCell>
                  <TableCell>
                    {exam.questionsPerStudent > 0
                      ? `${exam.questionsPerStudent} / ${exam.totalQuestions}`
                      : exam.totalQuestions}
                  </TableCell>
                  <TableCell>{getStatusBadge(exam.status)}</TableCell>
                  <TableCell>
                    {exam.scheduledStart
                      ? new Date(exam.scheduledStart).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(exam)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          publishMutation.mutate({
                            examId: exam.id,
                            publish: exam.status === "draft",
                          })
                        }
                      >
                        {exam.status === "draft" ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/cbt/exams/${exam.id}/results`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No exams found. Create your first exam to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateExam open={isCreateOpen} onOpenChange={onOpenChange} />
      <EditExam
        exam={selectedExam}
        open={isEditOpen}
        onOpenChange={onEditOpenChange}
      />
    </>
  );
}
