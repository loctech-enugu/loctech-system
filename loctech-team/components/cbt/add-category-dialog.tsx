"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import InputError from "../input-error";

const addCategorySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type AddCategoryForm = z.infer<typeof addCategorySchema>;

export interface CategoryCreated {
  id: string;
  name: string;
}

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when a category is successfully created. Use to select the new category (e.g. in create question form). */
  onSuccess?: (category: CategoryCreated) => void;
}

export default function AddCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCategoryDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<AddCategoryForm>({
    resolver: zodResolver(addCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const { mutate: createCategory, isPending } = useMutation({
    mutationFn: async (data: AddCategoryForm) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create category");
      return result;
    },
    onSuccess: (result) => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.reset({ name: "", description: "", isActive: true });
      onOpenChange(false);
      onSuccess?.({
        id: result.data.id,
        name: result.data.name,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Error creating category");
    },
  });

  const onSubmit = (values: AddCategoryForm) => {
    createCategory(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g. JavaScript"
            />
            <InputError message={form.formState.errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={2}
              placeholder="Brief description of this category"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) =>
                form.setValue("isActive", checked ?? true)
              }
            />
            <Label htmlFor="isActive">Active</Label>
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
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
