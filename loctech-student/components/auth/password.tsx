"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import InputError from "../input-error";
import { PasswordInput } from "../password-input";

// Create new course
async function changePassword(data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  const res = await fetch("/api/auth/update-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const response = await res.json();
  if (!res.ok) throw new Error(response.error || "Failed to create course");
  return response;
}
export const UpdatePasswordForm = () => {
  const currentPasswordInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);

  const [data, setData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  // 🔄 Mutation
  const { mutate, isPending } = useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      console.log(response);

      toast.success("Password updated successfully");
      setRecentlySuccessful(true);
      setData({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setErrors({});
      setTimeout(() => setRecentlySuccessful(false), 3000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update password");
    },
  });

  // 🔘 Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="grid gap-2">
        <Label htmlFor="current_password">Current password</Label>
        <PasswordInput
          id="current_password"
          ref={currentPasswordInput}
          value={data.current_password}
          onChange={(e) =>
            setData({ ...data, current_password: e.target.value })
          }
          type="password"
          autoComplete="current-password"
          placeholder="Current password"
        />
        <InputError message={errors.current_password} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          ref={passwordInput}
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          type="password"
          autoComplete="new-password"
          placeholder="New password"
        />
        <InputError message={errors.password} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password_confirmation">Confirm password</Label>
        <PasswordInput
          id="password_confirmation"
          value={data.password_confirmation}
          onChange={(e) =>
            setData({ ...data, password_confirmation: e.target.value })
          }
          type="password"
          autoComplete="new-password"
          placeholder="Confirm password"
        />
        <InputError message={errors.password_confirmation} />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save password"}
        </Button>

      </div>
    </form>
  );
};
