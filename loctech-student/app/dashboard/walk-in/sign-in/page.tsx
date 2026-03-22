import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import WalkInBarcodeSignIn from "@/components/student/walk-in-barcode-sign-in";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Walk-in Sign In", href: "/dashboard/walk-in/sign-in" },
];

export default function WalkInSignInPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Walk-in Sign In</h1>
        </div>
        <hr />
        <WalkInBarcodeSignIn />
      </div>
    </AppLayout>
  );
}
