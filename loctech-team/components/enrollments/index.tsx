"use client";

import { useDisclosure } from "@/hooks/use-disclosure";
import { EnrollmentsTable } from "./table";
import CreateEnrollment from "./create-enrollment";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EnrollmentsProps {
  classId?: string;
  studentId?: string;
}

function Enrollments({ classId, studentId }: EnrollmentsProps) {
  const { onOpen, onOpenChange, isOpen } = useDisclosure();

  return (
    <>
      {classId && (
        <div className="flex justify-end mb-4">
          <Button onClick={onOpen}>
            <Plus className="mr-2 h-4 w-4" />
            Enroll Student
          </Button>
        </div>
      )}
      <EnrollmentsTable classId={classId} studentId={studentId} />
      {classId && (
        <CreateEnrollment
          classId={classId}
          open={isOpen}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
}

export default Enrollments;
