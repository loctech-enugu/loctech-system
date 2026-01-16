"use client";

import { useDisclosure } from "@/hooks/use-disclosure";
import { Course } from "@/types";
import { useState } from "react";
import { CoursesTable } from "./table";
import EditCourse from "./edit-course";

function Courses({ courses }: { courses: Course[] }) {
  const { onOpen, onOpenChange, isOpen } = useDisclosure();
  const [course, setCourse] = useState<Course | null>(null);
  const onCourseEdited = (course: Course) => {
    setCourse(course);
    onOpen();
  };

  const countedCourses = courses.map((item, i) => ({
    ...item,
    count: (i + 1).toString(),
  }));

  return (
    <>
      <CoursesTable courses={countedCourses} onCourseEdited={onCourseEdited} />
      <EditCourse {...{ open: isOpen, onOpenChange, course }} />
    </>
  );
}

export default Courses;
