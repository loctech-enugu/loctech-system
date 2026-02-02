"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExamTimer } from "./exam-timer";
import { ViolationWarning } from "./violation-warning";
import { useExamSecurity } from "@/hooks/use-exam-security";
import { CheckCircle, XCircle, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

async function startExam(examId: string) {
  const res = await fetch(`/api/student/exams/${examId}`, {
    method: "GET",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to start exam");
  }
  return res.json();
}

async function saveAnswer(
  userExamId: string,
  questionId: string,
  answer: string | string[]
) {
  const res = await fetch(`/api/student/exams/${userExamId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionId,
      answer,
    }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to save answer");
  }
  return res.json();
}

async function submitExam(userExamId: string) {
  const res = await fetch(`/api/student/exams/${userExamId}/submit`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to submit exam");
  }
  return res.json();
}

async function recordViolation(userExamId: string, violation: any) {
  const res = await fetch(`/api/student/exams/${userExamId}/violations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: violation.type,
      timestamp: violation.timestamp,
    }),
  });
  if (!res.ok) {
    console.error("Failed to record violation");
  }
}

interface ExamTakingInterfaceProps {
  examId: string;
}

export default function ExamTakingInterface({
  examId,
}: ExamTakingInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    {}
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [showWarning, setShowWarning] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const { data: examData, isLoading } = useQuery({
    queryKey: ["exam-session", examId],
    queryFn: () => startExam(examId),
    enabled: !!examId && !examStarted && !!session?.user?.id,
  });

  const userExam = examData?.data;
  const questions = examData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const {
    violations,
    violationCount,
    warningCount,
    isFullScreen,
    requestFullScreen,
  } = useExamSecurity({
    enabled: examStarted,
    maxViolations: 5,
    onViolation: (violation) => {
      if (userExam?.id) {
        recordViolation(userExam.id, violation);
      }
      setShowWarning(true);
    },
    onMaxViolations: () => {
      handleAutoSubmit();
    },
  });

  useEffect(() => {
    if (userExam && !examStarted) {
      setExamStarted(true);
      requestFullScreen();
    }
  }, [userExam, examStarted, requestFullScreen]);

  const handleAnswerChange = (value: string | string[]) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Auto-save answer
    if (userExam?.id) {
      saveAnswer(userExam.id, currentQuestion.id, value).catch((error) => {
        console.error("Failed to save answer:", error);
      });
    }
  };

  const toggleFlag = () => {
    if (!currentQuestion) return;
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    setFlaggedQuestions(newFlagged);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (
      !confirm(
        "Are you sure you want to submit? You cannot change your answers after submission."
      )
    ) {
      return;
    }

    if (!userExam?.id) return;

    try {
      await submitExam(userExam.id);
      toast.success("Exam submitted successfully");
      router.push(`/dashboard/student/exams/${examId}/results`);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit exam");
    }
  };

  const handleAutoSubmit = async () => {
    if (!userExam?.id) return;

    try {
      await submitExam(userExam.id);
      toast.error(
        "Exam automatically submitted due to security violations"
      );
      router.push(`/dashboard/student/exams/${examId}/results`);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit exam");
    }
  };

  if (isLoading || !userExam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading exam...</div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{userExam.exam?.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ExamTimer
                duration={userExam.exam?.duration || 60}
                startTime={userExam.startTime ? new Date(userExam.startTime) : undefined}
                onTimeUp={handleAutoSubmit}
              />
              {violationCount > 0 && (
                <Badge variant="destructive">
                  Violations: {violationCount}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Questions</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q: any, index: number) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isFlagged = flaggedQuestions.has(q.id);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`
                          aspect-square rounded border-2 text-xs font-medium
                          ${
                            isCurrent
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300"
                          }
                          ${isAnswered ? "bg-green-100" : "bg-white"}
                          ${isFlagged ? "ring-2 ring-yellow-400" : ""}
                        `}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-yellow-400 rounded" />
                    <span>Flagged</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Question {currentQuestionIndex + 1}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{currentQuestion.type}</span>
                        <span>•</span>
                        <span>{currentQuestion.points} points</span>
                        <span>•</span>
                        <span>{currentQuestion.difficulty}</span>
                      </div>
                    </div>
                    <Button
                      variant={flaggedQuestions.has(currentQuestion.id) ? "default" : "outline"}
                      size="sm"
                      onClick={toggleFlag}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {flaggedQuestions.has(currentQuestion.id)
                        ? "Unflag"
                        : "Flag"}
                    </Button>
                  </div>

                  <div className="mb-6">
                    <p className="text-lg mb-4">{currentQuestion.question}</p>

                    {currentQuestion.type === "mcq" &&
                      currentQuestion.options && (
                        <div className="space-y-2">
                          {currentQuestion.options.map(
                            (option: string, index: number) => (
                              <label
                                key={index}
                                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuestion.id}`}
                                  value={option}
                                  checked={answers[currentQuestion.id] === option}
                                  onChange={(e) =>
                                    handleAnswerChange(e.target.value)
                                  }
                                  className="w-4 h-4"
                                />
                                <span>{option}</span>
                              </label>
                            )
                          )}
                        </div>
                      )}

                    {currentQuestion.type === "true_false" && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value="true"
                            checked={answers[currentQuestion.id] === "true"}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span>True</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value="false"
                            checked={answers[currentQuestion.id] === "false"}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span>False</span>
                        </label>
                      </div>
                    )}

                    {(currentQuestion.type === "essay" ||
                      currentQuestion.type === "fill_blank") && (
                      <textarea
                        className="w-full min-h-32 p-3 border rounded-lg"
                        value={
                          (answers[currentQuestion.id] as string) || ""
                        }
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Type your answer here..."
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {answeredCount} of {questions.length} answered
                    </div>
                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button onClick={handleSubmit} variant="default">
                        Submit Exam
                      </Button>
                    ) : (
                      <Button onClick={handleNext}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ViolationWarning
        open={showWarning}
        warningCount={warningCount}
        maxWarnings={3}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
