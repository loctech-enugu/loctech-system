import { CalendarOfReports } from "@/components/reports/CalendarEvent";
import SubmitReportModal from "@/components/reports/create";
import ReportDialog from "@/components/reports/generate-report";
import AppLayout from "@/layouts/app-layout";
import { authConfig } from "@/lib/auth";
import { Metadata } from "next";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Reports - LocTech",
  description: "Submit your daily reports to the LocTech team.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Reports - LocTech",
    description: "Submit your daily reports to the LocTech team.",
    // url: "https://cusorcart.com/how-to-stay-safe",
    type: "website",
  },
};

async function ReportsPage() {
  const session = await getServerSession(authConfig);
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin";
  return (
    <AppLayout breadcrumbs={[{ title: "Reports", href: "/reports" }]}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reports</h1>
          <div className="flex gap-2">
            <SubmitReportModal />
            {isAdmin && <ReportDialog />}
          </div>
        </div>
        {/* List of email lists will go here */}
        {/* <EmailListTable lists={emailLists} handleEdit={handleEdit} /> */}
        <CalendarOfReports />
      </div>
      {/* <EditList list={editing} {...{ open, setOpen }} /> */}
    </AppLayout>
  );
}

export default ReportsPage;
