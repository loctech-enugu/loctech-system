"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SpinnerLoader } from "../spinner";

type Lesson = {
  id: string;
  title: string;
  order: number;
  contentHtml: string;
};



type ClassLearningProps = {
  classId: string;
  /** When true, shows a back link to the class details page */
  showBackLink?: boolean;
};

export default function ClassLearning({ classId, showBackLink }: ClassLearningProps) {
  const {
    data: lessons = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["class-learning", classId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/learning`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load lessons");
      return (data.data || []) as Lesson[];
    },
  });

  const [activeLessonId, setActiveLessonId] = React.useState<string>("");
  const activeLesson = React.useMemo(
    () => lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0],
    [activeLessonId, lessons]
  );

  React.useEffect(() => {
    if (lessons.length === 0) return;
    if (!activeLessonId || !lessons.some((l) => l.id === activeLessonId)) {
      setActiveLessonId(lessons[0].id);
    }
  }, [lessons, activeLessonId]);
  const [query, setQuery] = React.useState("");
  const filteredLessons = React.useMemo(() => {
    if (!query.trim()) return lessons;
    return lessons.filter((lesson) => lesson.title.toLowerCase().includes(query.toLowerCase()));
  }, [lessons, query]);
  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLesson?.id);
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <SpinnerLoader title="Loading" message="Loading learning content…" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error instanceof Error ? error.message : "Could not load lessons"}
        </CardContent>
      </Card>
    );
  }

  if (lessons.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No published learning lessons available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-[70vh] rounded-xl border bg-card">
      {showBackLink ? (
        <div className="border-b bg-background px-4 py-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/dashboard/classes/${classId}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to class
            </Link>
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <aside className="border-r bg-card p-4 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Learning Paths</p>
              <p className="text-xs text-muted-foreground">Course modules</p>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Search lessons..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            {filteredLessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveLessonId(lesson.id)}
                className={`w-full rounded-r-full px-3 py-2 text-left text-sm transition ${activeLesson?.id === lesson.id
                  ? "bg-background font-semibold text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }`}
              >
                <span className="mr-2 text-xs">{lesson.order}.</span>
                {lesson.title}
              </button>
            ))}
          </div>
        </aside>

        <main className="p-6 lg:p-8 lg:col-span-9">
          {activeLesson ? (
            <>
              <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span>Learn</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-semibold text-primary">{activeLesson.title}</span>
              </div>
              <div className="mb-6 rounded-lg border bg-background p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lesson Progress</span>
                  <span className="font-medium">
                    {Math.max(activeIndex + 1, 1)} / {lessons.length}
                  </span>
                </div>
                <Progress className="w-full" value={((Math.max(activeIndex + 1, 1) / lessons.length) * 100)} />
              </div>

              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="px-0">
                  <CardTitle className="text-3xl font-bold">{activeLesson.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-0" id="learn-page">
                  <div
                    className="prose prose-slate max-w-none rounded-xl bg-background p-6 dark:prose-invert space-y-2"
                    dangerouslySetInnerHTML={{ __html: activeLesson.contentHtml || "<p>No content.</p>" }}
                  />
                </CardContent>
              </Card>

              <div className="mt-10 flex items-center justify-between border-t pt-6">
                <Button
                  variant="ghost"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {prevLesson ? `Previous: ${prevLesson.title}` : "Previous"}
                </Button>
                <Button
                  onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}
                  disabled={!nextLesson}
                >
                  {nextLesson ? `Next: ${nextLesson.title}` : "Completed"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Select a lesson to start.</div>
          )}
        </main>
      </div>
    </div>
  );
}
