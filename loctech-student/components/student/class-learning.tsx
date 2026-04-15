"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, BookOpen, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SpinnerLoader } from "../spinner";

type Lesson = {
  id: string;
  title: string;
  order: number;
  contentHtml: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

type CodeBlock = {
  language: string;
  content: string;
};

function detectCodeLanguage(value: string) {
  const code = value.trim();
  if (!code) return "plain";
  if (/<[a-z][\s\S]*>/i.test(code) || /<\/[a-z]+>/i.test(code)) return "html";
  if (/[.#]?[a-z0-9_-]+\s*\{[\s\S]*:[\s\S]*;\s*\}/i.test(code)) return "css";
  if (/\b(function|const|let|var|=>|console\.|document\.|window\.)\b/.test(code)) return "js";
  return "plain";
}

function getCodeBlocks(contentHtml: string): CodeBlock[] {
  const regex = /<pre([^>]*)>([\s\S]*?)<\/pre>/gi;
  const blocks: CodeBlock[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(contentHtml)) !== null) {
    const attrs = match[1] || "";
    const rawContent = decodeHtml((match[2] || "").trim());
    const classMatch = attrs.match(/class=["'][^"']*language-([a-z0-9_-]+)[^"']*["']/i);
    const dataLangMatch = attrs.match(/data-language=["']([^"']+)["']/i);
    const explicitLang = (classMatch?.[1] || dataLangMatch?.[1] || "plain").toLowerCase();
    const language = explicitLang === "plain" ? detectCodeLanguage(rawContent) : explicitLang;
    blocks.push({ language, content: rawContent });
  }

  return blocks;
}

function extractCodeByLanguage(contentHtml: string, lang: "html" | "css" | "js") {
  const blocks = getCodeBlocks(contentHtml);
  console.log(blocks);
  const exact = blocks.find((b) => b.language === lang);
  console.log("exact", exact);
  if (exact) return exact.content;
  if (lang === "html") return blocks.find((b) => b.language === "plain")?.content ?? "";
  return "";
}

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

  const [htmlCode, setHtmlCode] = React.useState("");
  const [cssCode, setCssCode] = React.useState("");
  const [jsCode, setJsCode] = React.useState("");

  const { data: progress } = useQuery({
    queryKey: ["lesson-try-it", activeLesson?.id, classId],
    enabled: !!activeLesson?.id,
    queryFn: async () => {
      const res = await fetch(`/api/learning/${activeLesson?.id}/try-it?classId=${classId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load try-it progress");
      return data.data as
        | { htmlCode: string; cssCode: string; jsCode: string; isCompleted: boolean }
        | null;
    },
  });

  React.useEffect(() => {
    if (!activeLesson) return;
    setHtmlCode(progress?.htmlCode ?? extractCodeByLanguage(activeLesson.contentHtml, "html"));
    setCssCode(progress?.cssCode ?? extractCodeByLanguage(activeLesson.contentHtml, "css"));
    setJsCode(progress?.jsCode ?? extractCodeByLanguage(activeLesson.contentHtml, "js"));
  }, [activeLesson, progress]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeLesson) return;
      const res = await fetch(`/api/learning/${activeLesson.id}/try-it`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, htmlCode, cssCode, jsCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save progress");
      return data;
    },
    onSuccess: () => toast.success("Try-It progress saved"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save progress"),
  });

  const previewDoc = `<!DOCTYPE html><html><head><style>${cssCode}</style></head><body>${htmlCode}<script>${jsCode}<\/script></body></html>`;
  const shouldShowTryIt = Boolean(activeLesson?.contentHtml?.toLowerCase().includes("<pre"));

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

              {shouldShowTryIt ? (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Try it Yourself</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>HTML</Label>
                        <Textarea rows={10} value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>CSS</Label>
                        <Textarea rows={10} value={cssCode} onChange={(e) => setCssCode(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>JavaScript</Label>
                        <Textarea rows={10} value={jsCode} onChange={(e) => setJsCode(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Saving..." : "Save try-it draft"}
                      </Button>
                    </div>
                    <div className="rounded-md border overflow-hidden">
                      <iframe title="Try it output" srcDoc={previewDoc} className="h-[260px] w-full bg-white" />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

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
