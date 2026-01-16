import ResetPasswordPage from "@/components/auth/reset-password";
import { Suspense } from "react";

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}

// ============================================
// REQUIRED SHADCN COMPONENTS
// ============================================

/*
Install these shadcn/ui components:

npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add alert
npx shadcn@latest add card

Or manually create them in your components/ui directory
*/
