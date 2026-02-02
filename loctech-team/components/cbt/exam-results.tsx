"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

async function fetchExamResult(examId: string, userId: string) {
  const res = await fetch(`/api/exams/${examId}/results/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch results");
  const data = await res.json();
  return data.data;
}

interface ExamResultsProps {
  examId: string;
}

export default function ExamResults({ examId }: ExamResultsProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: result, isLoading } = useQuery({
    queryKey: ["exam-result", examId, userId],
    queryFn: () => fetchExamResult(examId, userId!),
    enabled: !!userId && !!examId,
  });

  if (isLoading) {
    return <div>Loading results...</div>;
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No results found.</p>
        </CardContent>
      </Card>
    );
  }

  const passed = result.percentage >= (result.exam?.passingScore || 50);
  const correctCount = result.answers?.filter((a: any) => a.isCorrect).length || 0;
  const totalQuestions = result.answers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{result.exam?.title || "Exam Results"}</CardTitle>
          <CardDescription>Your exam performance summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {result.percentage?.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {correctCount} / {totalQuestions}
              </div>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {result.timeSpent || 0} min
              </div>
              <p className="text-sm text-muted-foreground">Time Spent</p>
            </div>
            <div className="text-center">
              <Badge
                className={
                  passed
                    ? "bg-green-100 text-green-800 text-lg px-4 py-2"
                    : "bg-red-100 text-red-800 text-lg px-4 py-2"
                }
              >
                {passed ? "PASSED" : "FAILED"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
          <CardDescription>Review your answers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.answers?.map((answer: any, index: number) => (
              <div
                key={answer.questionId}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      Question {index + 1}
                    </span>
                    {answer.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <Badge variant="outline">
                    {answer.pointsEarned || 0} / {answer.question?.points || 0}{" "}
                    points
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {answer.question?.question || "Question not available"}
                </p>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Your Answer: </span>
                    <span>{answer.answer || "No answer provided"}</span>
                  </div>
                  {!answer.isCorrect && answer.question?.correctAnswer && (
                    <div>
                      <span className="font-medium text-green-600">
                        Correct Answer:{" "}
                      </span>
                      <span>{answer.question.correctAnswer}</span>
                    </div>
                  )}
                  {answer.question?.explanation && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <span className="font-medium">Explanation: </span>
                      {answer.question.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
