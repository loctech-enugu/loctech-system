"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Play, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

async function fetchAvailableExams() {
  const res = await fetch("/api/student/exams");
  if (!res.ok) throw new Error("Failed to fetch exams");
  const data = await res.json();
  return data.data || [];
}

export default function StudentExamsList() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["student-exams", userId],
    queryFn: fetchAvailableExams,
    enabled: !!userId,
  });

  if (isLoading) {
    return <div>Loading exams...</div>;
  }

  return (
    <div className="space-y-4">
      {exams.length > 0 ? (
        exams.map((exam: any) => (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {exam.description || "No description"}
                  </CardDescription>
                </div>
                {exam.course && (
                  <Badge variant="outline">{exam.course.title}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Duration:</strong> {exam.duration} minutes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Questions:</strong>{" "}
                    {exam.questionsPerStudent > 0
                      ? `${exam.questionsPerStudent} / ${exam.totalQuestions}`
                      : exam.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <strong>Passing Score:</strong> {exam.passingScore}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {exam.attemptsRemaining > 0 ? (
                    <span>
                      {exam.attemptsRemaining} attempt(s) remaining
                    </span>
                  ) : (
                    <span className="text-red-600">No attempts remaining</span>
                  )}
                </div>
                <Button
                  asChild
                  disabled={!exam.canStart || exam.attemptsRemaining === 0}
                >
                  <Link href={`/dashboard/student/exams/${exam.id}/take`}>
                    {exam.inProgressExamId ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Continue Exam
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Exam
                      </>
                    )}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No available exams at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
