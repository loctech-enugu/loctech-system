"use client";

import { useDisclosure } from "@/hooks/use-disclosure";
import { Student } from "@/types";
import { useState } from "react";
import { StudentsTable } from "./table";
import EditStudentModal from "./edit";

function Students({ students }: { students: Student[] }) {
  const { onOpen, onOpenChange, isOpen } = useDisclosure();
  const [student, setStudent] = useState<Student | null>(null);
  const onStudentEdited = (student: Student) => {
    setStudent(student);
    onOpen();
  };

  const unassignedCount = students.filter((s) => (s.classCount ?? 0) === 0).length;

  return (
    <>
      {unassignedCount > 0 && (
        <div
          className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {unassignedCount === 1 ? (
            <>
              <strong>1</strong> student has no class assigned yet. Assign from{" "}
              <span className="font-medium">Enrollments</span> or the student record.
            </>
          ) : (
            <>
              <strong>{unassignedCount}</strong> students have no class assigned yet. Assign from{" "}
              <span className="font-medium">Enrollments</span> or the student record.
            </>
          )}
        </div>
      )}
      <StudentsTable students={students} onStudentEdited={onStudentEdited} />
      <EditStudentModal {...{ open: isOpen, onOpenChange, student }} />
    </>
  );
}

export default Students;
