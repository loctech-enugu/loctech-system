"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import CustomSelect from "../form-select.component";
import InputError from "../input-error";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";

const HEARD_ABOUT_OPTIONS = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "friend", label: "Friend / referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "website", label: "Website" },
  { value: "youtube", label: "YouTube" },
  { value: "radio", label: "Radio" },
  { value: "billboard", label: "Billboard" },
  { value: "flyers", label: "Flyers" },
  { value: "other", label: "Other" },
];

const inquirySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z.string().optional(),
  courseOfInterest: z.string().optional(),
  heardAboutUs: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

const defaultValues: InquiryFormValues = {
  name: "",
  email: "",
  phone: "",
  courseOfInterest: "",
  heardAboutUs: "",
  message: "",
};

interface InquiryFormProps {
  courses: { id: string; title: string }[];
}

async function postInquiry(payload: InquiryFormValues) {
  const res = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || undefined,
      courseOfInterest: payload.courseOfInterest?.trim() || undefined,
      heardAboutUs: payload.heardAboutUs?.trim() || undefined,
      message: payload.message.trim(),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to submit");
  }
  return data;
}

export default function InquiryForm({ courses }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const submitMutation = useMutation({
    mutationFn: postInquiry,
    onSuccess: () => {
      toast.success(
        "Thank you! We have received your inquiry and will get back to you soon."
      );
      reset(defaultValues);
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit inquiry");
    },
  });
  console.log(form.getValues());


  const onSubmit = (data: InquiryFormValues) => {
    submitMutation.mutate(data);
  };

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: c.title,
  }));

  if (submitted) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-lg font-medium text-green-600">Thank you for your inquiry!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We have received your message and will get back to you within 1–2 business days.
          You should have received an auto-reply email confirming your submission.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setSubmitted(false)}
        >
          Submit another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Your name"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          <InputError message={errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          <InputError message={errors.email?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" type="tel" placeholder="Optional" {...register("phone")} />
        <InputError message={errors.phone?.message} />
      </div>
      {courses.length > 0 && (
        <div className="space-y-2">
          <Label>Course of interest</Label>
          <Controller
            name="courseOfInterest"
            control={control}
            render={({ field }) => (
              <CustomSelect
                options={courseOptions}
                placeholder="Select a course (optional)"
                isClearable
                value={
                  courseOptions.find((o) => o.value === field.value) ?? null
                }
                onChange={(opt) =>
                  field.onChange(opt?.value)
                }
                onBlur={field.onBlur}
                inputId="courseOfInterest"
              />
            )}
          />
          <InputError message={errors.courseOfInterest?.message} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="heardAboutUs">How did you hear about us?</Label>

        <Select
          {...register("heardAboutUs")}>
          <SelectTrigger className="w-full max-w-48">
            <SelectValue placeholder="How did you hear about us?" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>How did you hear about us?</SelectLabel>
              {HEARD_ABOUT_OPTIONS.map((o) => (
                <SelectItem key={o.value || "empty"} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <InputError message={errors.heardAboutUs?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          rows={5}
          placeholder="Tell us how we can help..."
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        <InputError message={errors.message?.message} />
      </div>
      <Button type="submit" disabled={submitMutation.isPending}>
        {submitMutation.isPending ? "Submitting..." : "Submit Inquiry"}
      </Button>
    </form>
  );
}
