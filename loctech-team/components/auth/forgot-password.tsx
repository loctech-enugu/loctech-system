"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import InputError from "../input-error";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";

export default function ForgotPWForm() {
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType: "user" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }
      console.log(data);

      return data;
    },
    onSuccess: (data: Record<string, unknown>) => {
      if (data.success) {
        toast.success(
          (data.message as string) ?? "Password reset link sent to your email."
        );
        setEmail("");
      } else {
        toast.warning(
          (data.message as string) ?? "Password reset link sent to your email."
        );
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="off"
          value={email}
          autoFocus
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          disabled={mutation.isPending}
        />

        {/* Error display if API returned validation errors */}
        {mutation.isError && (
          <InputError message={(mutation.error as Error)?.message} />
        )}
      </div>

      <div className="flex items-center justify-start">
        <Button className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && (
            <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
          )}
          Email password reset link
        </Button>
      </div>
    </form>
  );
}
