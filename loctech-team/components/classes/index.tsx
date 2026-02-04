"use client";

import Link from "next/link";
import { ClassesTable } from "./table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function Classes() {
  return (
    <>
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link href="/dashboard/classes/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Link>
        </Button>
      </div>
      <ClassesTable />
    </>
  );
}

export default Classes;
