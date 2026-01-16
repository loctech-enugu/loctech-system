import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
];
export default function Home() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* <Head title="Dashboard" /> */}
      <div className="flex flex-col gap-6 p-6">
        {/* Banner */}
        <div className="rounded-xl bg-gradient-to-r from-[#7f5af0] to-[#f1c1e6] p-6 text-white flex items-center justify-between shadow-md">
          <div>
            <div className="font-bold text-lg mb-1">
              Unlock the Power of Our New Campaign Management Dashboard!
            </div>
            <div className="text-sm">
              Introducing our latest innovation – a revolutionary dashboard
              designed to elevate your campaign management.
            </div>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-[#7f5af0] font-semibold"
          >
            Try the New Features Now!
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <select className="rounded-md border px-3 py-2 text-sm">
              <option>All</option>
            </select>
            <select className="rounded-md border px-3 py-2 text-sm">
              <option>Campaign status</option>
            </select>
            <select className="rounded-md border px-3 py-2 text-sm">
              <option>Filters by tags...</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Filter by name or description..."
              className="rounded-md border px-3 py-2 text-sm w-64"
            />
            <Button variant="default" className="bg-primary text-white">
              + Create Campaign
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b pb-2">
          <Button
            variant="ghost"
            className="border-b-2 border-primary text-primary rounded-none"
          >
            Active <span className="ml-1 text-xs">24</span>
          </Button>
          <Button variant="ghost" className="text-muted-foreground">
            Completed <span className="ml-1 text-xs">179</span>
          </Button>
          <Button variant="ghost" className="text-muted-foreground">
            Draft <span className="ml-1 text-xs">3</span>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
