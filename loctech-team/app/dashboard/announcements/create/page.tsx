// app/announcements/create/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, userLinks } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import AppLayout from "@/layouts/app-layout";

// Validation schema
const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required").max(2000),
  audience: z.enum(["all", "staff", "students"]),
  expiresAt: z.date().optional().nullable(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

const breadcrumbs = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Announcements",
    href: userLinks.announcements,
  },
  {
    title: "Create Annoucement",
    href: userLinks.announcements,
  },
];

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      audience: "all",
      expiresAt: undefined,
    },
  });

  // Mutation to create announcement
  const mutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create announcement");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Announcement created successfully.");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      router.push("/announcements");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create announcement.");
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    mutation.mutate(data);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="container py-8 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Announcement</CardTitle>
            <CardDescription>
              Share important updates with staff, students, or everyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Holiday Notice" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your announcement here..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Audience */}
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="staff">Staff Only</SelectItem>
                          <SelectItem value="students">
                            Students Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiry (Optional) */}
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expires At (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick an expiry date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => field.onChange(date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Announcement will be hidden after this date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Creating..." : "Create Announcement"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
