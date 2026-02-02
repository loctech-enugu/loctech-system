import AuthErrorClient from "@/components/auth/error";
import { Suspense } from "react";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AuthErrorClient />
    </Suspense>
  );
}
