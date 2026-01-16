import { Course } from "@/types";
import { FieldErrors, UseFormReturn } from "react-hook-form";
import { StudentFormValues } from "./student-register";
import InputError from "../input-error";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";

interface RegistrationCoursesProps {
  courses: Course[];
  form: UseFormReturn<StudentFormValues>;
  errors: FieldErrors<StudentFormValues>;
}

function RegistrationCourses({
  courses,
  form,
  errors,
}: RegistrationCoursesProps) {
  const [searchValue, setSearchValue] = useState("");
  const filtered = courses.filter((c) =>
    c.title.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
  );

  return (
    <div className="grid gap-2">
      <p className="font-medium mb-1">Select Course(s)</p>
      <Input
        placeholder="Search courses..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="mb-2"
      />
      {filtered?.map((course) => (
        <label
          key={course.id}
          className={cn(
            "flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-muted",
            form.watch("courses")?.includes(course.id) && "bg-muted"
          )}
        >
          <Checkbox
            checked={form.watch("courses")?.includes(course.id)}
            onCheckedChange={(checked) => {
              const current = form.getValues("courses");
              if (checked) form.setValue("courses", [...current, course.id]);
              else
                form.setValue(
                  "courses",
                  current.filter((id) => id !== course.id)
                );
            }}
          />
          {course.title}
        </label>
      ))}
      <InputError message={errors.courses?.message} />
    </div>
  );
}

export default RegistrationCourses;
