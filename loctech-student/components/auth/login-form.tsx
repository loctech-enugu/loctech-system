"use client";

import { LoaderCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import * as z from "zod";

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

// Zod schema for login form
const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      if (!res || res.error) {
        throw new Error(res?.error || "Invalid credentials");
      }
      return { ok: true } as const;
    },
    onSuccess: () => {
      toast.success("Logged in successfully");
      router.replace("/dashboard");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoFocus
              tabIndex={1}
              autoComplete="email"
              placeholder="email@example.com"
              className={cn(errors.email && "border-red-500")}
              {...register("email")}
            />
            <InputError message={errors.email?.message} />
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
              tabIndex={2}
              autoComplete="current-password"
              placeholder="Password"
              className={cn(errors.password && "border-red-500")}
              {...register("password")}
            />
            <InputError message={errors.password?.message} />
          </div>

          <div className="flex items-center space-x-3">
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="remember"
                  tabIndex={3}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
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
