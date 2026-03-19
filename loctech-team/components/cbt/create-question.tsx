"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import InputError from "../input-error";
import { useRouter } from "next/navigation";
import AddCategoryDialog from "./add-category-dialog";
import { generateQuestionWithAI } from "@/services/ai.service";
import { cn } from "@/lib/utils";
import { Category } from "@/types";

async function fetchCategories() {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return data.data as Category[] || [];
}

const createQuestionSchema = z.object({
  type: z.enum(["mcq", "true_false", "essay", "fill_blank", "matching"]),
  questionText: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  points: z.number().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  categoryId: z.string().min(1, "Category is required"),
  isActive: z.boolean(),
  tags: z.array(z.string()).optional(),
});

type CreateQuestionForm = z.infer<typeof createQuestionSchema>;

interface CreateQuestionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const parseTags = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatTags = (tags: string[] | undefined): string =>
  Array.isArray(tags) ? tags.join(", ") : "";

export default function CreateQuestion({
  open,
  onOpenChange,
}: CreateQuestionProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [options, setOptions] = React.useState<string[]>([]);
  const [newOption, setNewOption] = React.useState("");
  const [addCategoryOpen, setAddCategoryOpen] = React.useState(false);
  const [aiModel, setAiModel] = React.useState<"openai" | "gemini">("openai");
  const [generated, setGenerated] = React.useState(false);
  const [tagsInput, setTagsInput] = React.useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });


  const { mutate: generateQuestion, isPending: isGenerating } = useMutation({
    mutationFn: generateQuestionWithAI,
    onSuccess: (data) => {
      const generatedType = data.type as CreateQuestionForm["type"] | undefined;
      const normalizedType: CreateQuestionForm["type"] =
        generatedType === "mcq" || generatedType === "true_false" || generatedType === "essay"
          ? generatedType
          : form.getValues("type");
      const generatedOptions = Array.isArray(data.options) ? data.options : [];

      form.setValue("type", normalizedType);
      form.setValue("questionText", data.questionText || "");
      form.setValue("correctAnswer", data.correctAnswer || "");
      form.setValue("explanation", data.explanation || "");
      form.setValue("difficulty", data.difficulty || form.getValues("difficulty"));
      form.setValue("options", generatedOptions);
      const generatedTags = Array.isArray(data.tags) ? data.tags : [];
      form.setValue("tags", generatedTags);
      setTagsInput(formatTags(generatedTags));
      setOptions(generatedOptions);
      setNewOption("");
      setGenerated(true);
    },
    onError: (error) => {
      toast.error(error.message || "Error generating question");
    },
  });
  const handleAI = async () => {
    const category = categories.find((c) => c.id === form.getValues("categoryId"));
    generateQuestion({
      topic: category?.name || "General knowledge",
      difficulty: form.getValues("difficulty"),
      type: (form.getValues("type") === "essay"
        ? "essay"
        : form.getValues("type")) as "mcq" | "true_false" | "essay",
      model: aiModel,
    });
  };


  const form = useForm<CreateQuestionForm>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      type: "mcq",
      points: 1,
      difficulty: "medium",
      isActive: true,
      options: [],
      explanation: "",
      categoryId: "",
      questionText: "",
      correctAnswer: "",
      tags: [],
    },
  });

  const questionType = form.watch("type");

  const { mutate: createQuestion, isPending } = useMutation({
    mutationFn: async (data: CreateQuestionForm) => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          question: data.questionText, // API expects "question" not "questionText"
          options: questionType === "mcq" ? options : undefined,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation || "",
          points: data.points,
          difficulty: data.difficulty,
          categoryId: data.categoryId,
          isActive: data.isActive,
          tags: data.tags || [],
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create question");
      return result;
    },
    onSuccess: () => {
      toast.success("Question created successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      form.reset({
        type: "mcq",
        points: 1,
        difficulty: "medium",
        isActive: true,
        options: [],
        explanation: "",
        categoryId: "",
        questionText: "",
        correctAnswer: "",
        tags: [],
      });
      setOptions([]);
      setNewOption("");
      setTagsInput("");
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error creating question");
    },
  });

  const onSubmit = (values: CreateQuestionForm) => {
    const normalizedTags = parseTags(tagsInput);
    form.setValue("tags", normalizedTags);

    // Validate MCQ options
    if (questionType === "mcq") {
      if (options.length < 2) {
        toast.error("MCQ questions require at least 2 options");
        return;
      }
      // Ensure correct answer is one of the options
      if (!options.includes(values.correctAnswer)) {
        toast.error("Correct answer must be one of the options");
        return;
      }
    }

    // Validate category is selected
    if (!values.categoryId) {
      toast.error("Please select a category");
      return;
    }

    createQuestion({
      ...values,
      tags: normalizedTags,
    });
  };

  const addOption = () => {
    if (newOption.trim()) {
      const updatedOptions = [...options, newOption.trim()];
      setOptions(updatedOptions);
      form.setValue("options", updatedOptions);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    form.setValue("options", updatedOptions);
    // If the removed option was the correct answer, clear it
    if (form.getValues("correctAnswer") === options[index]) {
      form.setValue("correctAnswer", "");
    }
  };

  const reset = () => {
    form.reset({
      type: "mcq",
      points: 1,
      difficulty: "medium",
      isActive: true,
      options: [],
      explanation: "",
      categoryId: "",
      questionText: "",
      correctAnswer: "",
      tags: [],
    });
    setOptions([]);
    setNewOption("");
    setTagsInput("");
    setGenerated(false);
  };
  return (
    <>
      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onSuccess={(category) => {
          form.setValue("categoryId", category.id);
        }}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Question</DialogTitle>
          </DialogHeader>
          <div>
            <div className="flex gap-2 justify-end mb-2">
              <Select value={aiModel} onValueChange={(v) => setAiModel(v as "openai" | "gemini")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4o-mini)</SelectItem>
                  <SelectItem value="gemini">Gemini (2.0 Flash)</SelectItem>
                </SelectContent>
              </Select>
              <div
                className={cn("grid gap-2", generated && "grid-cols-2")}
              >
                <Button
                  variant="secondary"
                  onClick={handleAI}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating
                    ? "Thinking..."
                    : `Generate with ${aiModel.toUpperCase()}`}
                </Button>
                {generated && (
                  <Button variant="outline" onClick={reset} className="w-full">
                    Reset
                  </Button>
                )}
              </div>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Question Type *</Label>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                          <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                          <SelectItem value="matching">Matching</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <InputError message={form.formState.errors.type?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <div className="flex gap-2">
                    <Controller
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Add new category"
                      onClick={() => setAddCategoryOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <InputError
                    message={form.formState.errors.categoryId?.message}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionText">Question *</Label>
                <Textarea
                  id="questionText"
                  {...form.register("questionText")}
                  rows={3}
                />
                <InputError
                  message={form.formState.errors.questionText?.message}
                />
              </div>

              {questionType === "mcq" && (
                <div className="space-y-2">
                  <Label>Options *</Label>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={option} readOnly />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add option"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption();
                          }
                        }}
                      />
                      <Button type="button" onClick={addOption}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Correct Answer *</Label>
                {questionType === "mcq" ? (
                  <Controller
                    control={form.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Input id="correctAnswer" {...form.register("correctAnswer")} />
                )}
                <InputError
                  message={form.formState.errors.correctAnswer?.message}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="points">Points *</Label>
                  <Input
                    id="points"
                    type="number"
                    {...form.register("points", { valueAsNumber: true })}
                  />
                  <InputError message={form.formState.errors.points?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Controller
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <InputError
                    message={form.formState.errors.difficulty?.message}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  {...form.register("explanation")}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTagsInput(value);
                    form.setValue("tags", parseTags(value));
                  }}
                  placeholder="e.g. networking, osi model, fundamentals"
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Question"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
