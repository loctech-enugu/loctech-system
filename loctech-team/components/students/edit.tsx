"use client";

import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import validator from "validator";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InputError from "../input-error";
import { cn } from "@/lib/utils";
import { Student, Course } from "@/types";
import CustomSelect from "../form-select.component";

// -------------------- Schema --------------------
/* eslint-disable */
const editStudentSchema = z.object({
  name: z.string().min(2, "Student name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  highestQualification: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  heardFrom: z.enum([
    "Google",
    "Facebook",
    "Twitter",
    "Others",
    "Loctech Website",
    "Radio",
    "Billboard",
    "Instagram",
    "Flyers",
    "Friends",
    "Other",
  ]),
  status: z.enum(["active", "graduated", "suspended"]),
  nextOfKin: z.object({
    name: z.string().min(2, "Next of kin name is required"),
    relationship: z.string().min(2, "Relationship is required"),
    contact: z.string().min(2, "Contact is required"),
  }),
  courses: z.array(z.string()).optional(),
});

type EditStudentForm = z.infer<typeof editStudentSchema>;

// -------------------- API Helpers --------------------
async function fetchCourses() {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  return data.data as Course[];
}

async function updateStudent(id: string, data: EditStudentForm) {
  const res = await fetch(`/api/students/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update student");
  return json;
}

// -------------------- Component --------------------
interface EditStudentProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditStudentModal({
  student,
  open,
  onOpenChange,
}: EditStudentProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: courseList, isLoading: loadingCourses } = useQuery({
    queryKey: ["course-list"],
    queryFn: fetchCourses,
  });

  const mutation = useMutation({
    mutationFn: (data: EditStudentForm) => updateStudent(student!.id, data),
    onSuccess: () => {
      toast.success("Student updated successfully");
      router.refresh();
      onOpenChange(false);
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Failed to update student";
      toast.error(msg);
    },
  });
  console.log(student);

  useEffect(() => {
    if (!student) return;
    setErrors({});
  }, [student]);

  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {};
    if (validator.isEmpty((formData.get("name") as string) || ""))
      newErrors.name = "Student name is required.";
    if (validator.isEmpty((formData.get("nextOfKinName") as string) || ""))
      newErrors.nextOfKinName = "Next of kin name is required.";
    if (validator.isEmpty((formData.get("nextOfKinContact") as string) || ""))
      newErrors.nextOfKinContact = "Next of kin contact is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const proceed = (formData: FormData) => {
    if (!validateForm(formData)) return;

    const payload: EditStudentForm = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
      highestQualification:
        (formData.get("highestQualification") as string) || undefined,
      stateOfOrigin: (formData.get("stateOfOrigin") as string) || undefined,
      nationality: (formData.get("nationality") as string) || undefined,
      occupation: (formData.get("occupation") as string) || undefined,
      heardFrom: formData.get("heardFrom") as EditStudentForm["heardFrom"],
      status: formData.get("status") as "active" | "graduated" | "suspended",
      nextOfKin: {
        name: formData.get("nextOfKinName") as string,
        relationship: formData.get("nextOfKinRelationship") as string,
        contact: formData.get("nextOfKinContact") as string,
      },
      courses: formData.getAll("courses") as string[],
    };

    mutation.mutate(payload);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    proceed(formData);
  };

  if (!student) return null;

  const courseOptions = courseList?.map((c) => ({
    value: c.id,
    label: `${c.title}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[80vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student details below.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="space-y-4"
          noValidate
        >
          {/* Student Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                name="name"
                defaultValue={student.name}
                className={cn(errors.name && "border-red-500")}
              />
              <InputError message={errors.name} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input name="email" defaultValue={student.email || ""} />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input name="phone" defaultValue={student.phone || ""} />
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input name="address" defaultValue={student.address || ""} />
            </div>
            <div className="grid gap-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                name="dateOfBirth"
                defaultValue={student.dateOfBirth?.split("T")[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label>Highest Qualification</Label>
              <Input
                name="highestQualification"
                defaultValue={student.highestQualification || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label>State of Origin</Label>
              <Input
                name="stateOfOrigin"
                defaultValue={student.stateOfOrigin || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nationality</Label>
              <Input
                name="nationality"
                defaultValue={student.nationality || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label>Occupation</Label>
              <Input
                name="occupation"
                defaultValue={student.occupation || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label>Heard From</Label>
              <Select name="heardFrom" defaultValue={student.heardFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Google",
                    "Facebook",
                    "Twitter",
                    "Others",
                    "Loctech Website",
                    "Radio",
                    "Billboard",
                    "Instagram",
                    "Flyers",
                    "Friends",
                    "Other",
                  ].map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Next of Kin */}
          <div className="pt-4 border-t">
            <h3 className="font-medium text-base mb-2">Next of Kin</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  name="nextOfKinName"
                  defaultValue={student.nextOfKin.name}
                />
                <InputError message={errors.nextOfKinName} />
              </div>
              <div className="grid gap-2">
                <Label>Relationship</Label>
                <Input
                  name="nextOfKinRelationship"
                  defaultValue={student.nextOfKin.relationship}
                />
              </div>
              <div className="grid gap-2">
                <Label>Contact</Label>
                <Input
                  name="nextOfKinContact"
                  defaultValue={student.nextOfKin.contact}
                />
                <InputError message={errors.nextOfKinContact} />
              </div>
            </div>
          </div>

          {/* Courses */}
          <div className="pt-4 border-t grid gap-2">
            <Label>Assigned Courses</Label>
            <CustomSelect
              name="courses"
              options={courseOptions}
              isLoading={loadingCourses}
              isMulti
              defaultValue={student.courses.map((c) => ({
                value: c.id,
                label: `${c.title} (${c.category || "N/A"})`,
              }))}
            />
          </div>

          {/* Status */}
          <div className="pt-4 border-t grid gap-2">
            <Label>Status</Label>
            <Select name="status" defaultValue={student.status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
