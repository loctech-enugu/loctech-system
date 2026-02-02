"use client";

import { LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

import InputError from "@/components/input-error";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { cn } from "@/lib/utils";
import GoogleSignIn from "./google-sign";
import { useRouter } from "next/navigation";
import validator from "validator";

type LoginFormData = {
  email: string;
  password: string;
  remember: boolean;
};

const LoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async () => {
      // simple front-end validation
      const newErrors: { email?: string; password?: string } = {};
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.email && !validator.isEmail(formData.email))
        newErrors.email = "Invalid email address";
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        throw new Error("Please fix the form errors");
      }

      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      if (!res || res.error) {
        throw new Error(res?.error || "Invalid credentials");
      }
      return { ok: true } as const;
    },
    onSuccess: () => {
      toast.success("Logged in successfully");
      // Optional: window.location.assign("/");
      router.replace("/dashboard");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <>
      <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              tabIndex={1}
              autoComplete="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@example.com"
              className={cn(errors.email && "border-red-500")}
            />
            <InputError message={errors.email} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <TextLink
                href="/auth/forgot-password"
                className="ml-auto text-sm"
                tabIndex={5}
              >
                Forgot password?
              </TextLink>
            </div>
            <PasswordInput
              id="password"
              type="password"
              required
              tabIndex={2}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Password"
              className={cn(errors.password && "border-red-500")}
            />
            <InputError message={errors.password} />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="remember"
              name="remember"
              checked={formData.remember}
              onClick={() =>
                setFormData({ ...formData, remember: !formData.remember })
              }
              tabIndex={3}
            />
            <Label htmlFor="remember">Remember me</Label>
          </div>

          <Button
            type="submit"
            className="mt-4 w-full"
            tabIndex={4}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending && (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            )}
            Log in
          </Button>
        </div>
        <GoogleSignIn />
        {/* <div className="text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <TextLink href="/auth/register" tabIndex={5}>
            Sign up
          </TextLink>
        </div> */}
      </form>
    </>
  );
};

export default LoginForm;
