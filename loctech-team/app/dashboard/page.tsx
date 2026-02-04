import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import StaffDashboard, {
  DashboardBanner,
  NewYearBanner,
} from "@/components/dashboard/staff-overview";
import { Separator } from "@/components/ui/separator";
import AdminOverview from "@/components/dashboard/enhanced-admin-overview";
import { getDashboardStats } from "@/backend/controllers/dashboard.controller";
import InstructorDashboard from "@/components/instructor/dashboard";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
];

export default async function Dashboard() {
  const session = await getServerSession(authConfig);
  const stats = await getDashboardStats();
  const user = session?.user;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* <Head title="Dashboard" /> */}

      <div className="flex flex-col gap-6 p-6">
        {new Date().getMonth() === 0 ? <NewYearBanner /> : <DashboardBanner />}

        <Separator className="my-2" />

        {user?.role !== "admin" && user?.role !== "super_admin" ? (
          <>
            <StaffDashboard stats={stats} />
            <InstructorDashboard />
          </>
        ) : (
          <AdminOverview stats={stats} />
        )}
      </div>
    </AppLayout>
  );
}
