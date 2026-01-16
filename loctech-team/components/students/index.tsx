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

  return (
    <>
      <StudentsTable students={students} onStudentEdited={onStudentEdited} />
      <EditStudentModal {...{ open: isOpen, onOpenChange, student }} />
    </>
  );
}

export default Students;
