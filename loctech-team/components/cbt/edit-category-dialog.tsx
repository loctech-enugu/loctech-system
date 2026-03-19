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

const editCategorySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type EditCategoryForm = z.infer<typeof editCategorySchema>;

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCategoryDialog({
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditCategoryForm>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      isActive: category?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description ?? "",
        isActive: category.isActive,
      });
    }
  }, [category, form]);

  const { mutate: updateCategory, isPending } = useMutation({
    mutationFn: async (data: EditCategoryForm) => {
      const res = await fetch(`/api/categories/${category?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update category");
      return result;
    },
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Error updating category");
    },
  });

  const onSubmit = (values: EditCategoryForm) => {
    updateCategory(values);
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
