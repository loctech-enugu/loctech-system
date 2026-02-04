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
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDisclosure } from "@/hooks/use-disclosure";
import CreateQuestion from "./create-question";
import EditQuestion from "./edit-question";
import type { Question } from "@/types";

async function fetchQuestions() {
  const res = await fetch("/api/questions");
  if (!res.ok) throw new Error("Failed to fetch questions");
  const data = await res.json();
  return data.data || [];
}

async function deleteQuestion(questionId: string) {
  const res = await fetch(`/api/questions/${questionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete question");
  }
  return res.json();
}

export default function QuestionsManagement() {
  const queryClient = useQueryClient();
  const { onOpen, onOpenChange, isOpen: isCreateOpen } = useDisclosure();
  const {
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
    isOpen: isEditOpen,
  } = useDisclosure();
  const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      toast.success("Question deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete question";
      toast.error(errorMessage);
    },
  });

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    onEditOpen();
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, string> = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[difficulty] || "bg-gray-200 text-gray-800"}>
        {difficulty}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Loading questions...</div>;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={onOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Create Question
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length > 0 ? (
              questions.map((question: Question) => (
                <TableRow key={question.id}>
                  <TableCell className="max-w-md">
                    <p className="truncate">
                      {question.questionText}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{question.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {question.category || "-"}
                  </TableCell>
                  <TableCell>
                    {getDifficultyBadge(question.difficulty)}
                  </TableCell>
                  <TableCell>{question.points}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        question.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-800"
                      }
                    >
                      {question.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this question?"
                            )
                          ) {
                            deleteMutation.mutate(question.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No questions found. Create your first question to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateQuestion open={isCreateOpen} onOpenChange={onOpenChange} />
      <EditQuestion
        question={selectedQuestion}
        open={isEditOpen}
        onOpenChange={onEditOpenChange}
      />
    </>
  );
}
