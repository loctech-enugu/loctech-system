"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface InquiryFormProps {
  courses: { id: string; title: string }[];
}

export default function InquiryForm({ courses }: InquiryFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const courseOfInterest = formData.get("courseOfInterest") as string;
    const message = formData.get("message") as string;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      toast.error("Please fill in name, email, and message.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || undefined,
          courseOfInterest: courseOfInterest || undefined,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to submit");

      setSubmitted(true);
      form.reset();
      toast.success("Thank you! We've received your inquiry and will get back to you soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit inquiry");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-lg font-medium text-green-600">Thank you for your inquiry!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We've received your message and will get back to you within 1-2 business days.
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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" placeholder="Optional" />
      </div>
      {courses.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="courseOfInterest">Course of interest</Label>
          <select
            id="courseOfInterest"
            name="courseOfInterest"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a course (optional)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us how we can help..."
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Inquiry"}
      </Button>
    </form>
  );
}
