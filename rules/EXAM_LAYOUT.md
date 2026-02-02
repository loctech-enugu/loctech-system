example and reference
import { useState, useEffect } from "react";
import { UserExamRoot } from "@/types/exam";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLoaderData } from "react-router";
import { useFullScreen } from "@/hooks/useFullScreen";
import { useTabFocus } from "@/hooks/useTabFocus";
import { useExamTimer } from "@/hooks/use-exam-timer";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { QuestionCard } from "@/components/exam/question-card";
import { Button } from "@/components/ui/button";
import { QuestionNavigation } from "@/components/exam/QuestionNavigation";
import { CalculatorDialog } from "@/components/exam/calculator-dialog";
import { WarningModal } from "@/components/exam/WarningModal";
import { useSubmitExam } from "@/hooks/use-exam";
import SubmitLoader from "@/components/exam/submit-loader";
import ExamSubmitted from "@/components/exam/complete";
import { ExamSubmission } from "@/services/exam.service";

export default function StartExamPage() {
  const userExam = useLoaderData() as UserExamRoot;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false); // Prevent duplicate submissions

  console.log("UserExam data:", userExam);

  const { requestFullScreen } = useFullScreen();
  const { tabSwitchCount, showWarning, resetWarnings } = useTabFocus();

  // Only initialize timer if exam has started
  const { timeLeft, formattedTime } = useExamTimer(
    userExam.startTime,
    userExam.exam.duration
  );

  const submitMutation = useSubmitExam();

  const currentQuestion = userExam.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / userExam.exam.questionsPerStudent) * 100;

  // Auto-start full screen and exam
  useEffect(() => {
    if (userExam.status === "NOT_STARTED") {
      requestFullScreen();
      // TODO: Add API call to update status to IN_PROGRESS
      // This should set userExam.startTime on the backend
      console.log(
        "Starting exam - API call needed to set status to IN_PROGRESS"
      );
    }
  }, [userExam.status, requestFullScreen]);

  // Handle tab switch warnings
  useEffect(() => {
    // Only check violations if exam is in progress
    if (
      userExam.status !== "COMPLETED" &&
      tabSwitchCount >= 3 &&
      !hasAutoSubmitted
    ) {
      console.log("Tab switch violation detected, auto-submitting");
      handleAutoSubmit("tab_switch_violation");
    }
    /* eslint-disable-next-line */
  }, [tabSwitchCount, userExam.status, hasAutoSubmitted]);

  // Handle time expiry - FIXED VERSION
  useEffect(() => {
    // Only check time if:
    // 1. Exam is in progress
    // 2. StartTime exists
    // 3. Time has actually run out
    // 4. Not already submitting
    // 5. Haven't already auto-submitted
    const isExamInProgress = userExam.status === "IN_PROGRESS";
    const hasStartTime = !!userExam.startTime;
    const timeExpired = timeLeft <= 0;
    const notSubmitting = !submitMutation.isPending;
    const notAlreadySubmitted = !hasAutoSubmitted;

    if (
      isExamInProgress &&
      hasStartTime &&
      timeExpired &&
      notSubmitting &&
      notAlreadySubmitted
    ) {
      console.log("Time expired, auto-submitting exam");
      handleAutoSubmit("time_up");
    }
    /* eslint-disable-next-line */
  }, [
    timeLeft,
    submitMutation.isPending,
    userExam.status,
    userExam.startTime,
    hasAutoSubmitted,
  ]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < userExam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = (
    completionReason: "manual" | "time_up" | "tab_switch_violation" = "manual"
  ) => {
    console.log("handleAutoSubmit called:", {
      completionReason,
      isPending: submitMutation.isPending,
      hasAutoSubmitted,
    });

    // Prevent multiple submissions
    if (submitMutation.isPending || hasAutoSubmitted) {
      console.warn("Submission already in progress or completed");
      return;
    }

    // Mark as submitted to prevent duplicate calls
    if (completionReason !== "manual") {
      setHasAutoSubmitted(true);
    }

    // Prepare submission data with proper date format
    const formData: ExamSubmission = {
      answers,
      completionReason,
      submittedAt: new Date().toISOString(),
      warnings: tabSwitchCount,
    };

    console.log("Submitting exam:", {
      answersCount: Object.keys(answers).length,
      completionReason,
      warnings: tabSwitchCount,
      timestamp: formData.submittedAt,
    });

    submitMutation.mutate({ examId: userExam.id, submission: formData });
  };

  // Show loading state while submitting
  if (submitMutation.isPending) {
    return <SubmitLoader />;
  }

  // Show success state after submission
  if (submitMutation.isSuccess) {
    return <ExamSubmitted userExam={userExam} answers={answers} />;
  }

  // Don't render exam if it's not started or already completed
  if (userExam.status === "COMPLETED" || userExam.status === "EXPIRED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Exam Not Available</h2>
            <p className="text-gray-600">
              This exam has already been {userExam.status.toLowerCase()}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ExamHeader
        examTitle={userExam.exam.title}
        timeLeft={formattedTime}
        onCalculatorOpen={() => setCalculatorOpen(true)}
        onExitExam={() => handleAutoSubmit("manual")}
      />

      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Progress value={progress} className="w-full" />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>
                      Question {currentQuestionIndex + 1} of{" "}
                      {userExam.exam.questionsPerStudent}
                    </span>
                    <span>{Math.round(progress)}% Complete</span>
                  </div>
                </div>

                <QuestionCard
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ""}
                  onAnswerChange={(answer) =>
                    handleAnswerChange(currentQuestion.id, answer)
                  }
                  questionNumber={currentQuestionIndex + 1}
                />

                <div className="flex justify-between mt-8">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={
                      currentQuestionIndex === userExam.questions.length - 1
                    }
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <QuestionNavigation
              questions={userExam.questions}
              currentIndex={currentQuestionIndex}
              answers={answers}
              onQuestionSelect={setCurrentQuestionIndex}
            />
          </div>
        </div>
      </div>

      <CalculatorDialog
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />

      <WarningModal
        open={showWarning}
        onClose={resetWarnings}
        warningCount={tabSwitchCount}
      />
    </div>
  );
}
