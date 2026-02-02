"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authLinks } from "@/lib/utils";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign in link is no longer valid.",
  Default: "An unexpected error occurred. Please try again later.",
};

export default function AuthErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") ?? "Default";

  // If error is a known key, use mapped message; otherwise, show error as message
  const message =
    errorMessages[error] ||
    error || // If error is a custom message, show it
    errorMessages["Default"];

  return (
    <section className="h-screen centered bg-primary">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 ">
        <div className="mx-auto max-w-screen-sm text-center centered flex-col">
          <TriangleAlert className="w-3/4 h-auto text-white" />
          <div className="space-y-6 -mt-6">
            <h2 className="mt-6 text-2xl font-bold text-white">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-gray-200">{message}</p>
            <Button asChild variant={"secondary"} color="primary">
              <Link href={authLinks.login}>Back to Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
