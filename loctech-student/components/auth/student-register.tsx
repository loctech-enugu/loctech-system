"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Loader2 } from "lucide-react";
import { cn, goToTop } from "@/lib/utils";
import { Course } from "@/types";
import RegistrationCourses from "./registration-courses";

export const RefreshButton = () => (
  <Button onClick={() => window.location.reload()}>Refresh Page</Button>
);

// 🧩 Zod schema
const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  address: z.string().min(1, "Address is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  highestQualification: z.string().min(1, "Qualification is required"),
  phone: z.string().min(1, "Phone is required"),
  stateOfOrigin: z.string().min(1, "State of origin is required"),
  nationality: z.string().min(1, "Nationality is required"),
  nextOfKin: z.object({
    name: z.string().min(1, "Next of kin name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    contact: z.string().min(1, "Contact is required"),
  }),
  courses: z.array(z.string()).min(1, "Select at least one course"),
  occupation: z.string().min(1, "Occupation is required"),
  heardFrom: z.string().min(1, "Select how you heard about us"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

// 🧠 Helper for showing error messages
const InputError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

export default function CreateStudentForm({ courses }: { courses: Course[] }) {
  const [step, setStep] = useState(1);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      address: "",
      dateOfBirth: "",
      highestQualification: "",
      phone: "",
      stateOfOrigin: "",
      nationality: "",
      nextOfKin: { name: "", relationship: "", contact: "" },
      courses: [],
      occupation: "",
      heardFrom: "",
    },
  });

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = form;

  // 🚀 Submit Mutation
  const mutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create student");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Student registered successfully!");
      form.reset();
      setStep(1);
    },
    onError: () => toast.error("Failed to register student."),
  });

  // 🧭 Validation per step before next
  const handleNext = async () => {
    let fieldsToValidate: (keyof StudentFormValues | string)[] = [];

    if (step === 1) {
      fieldsToValidate = [
        "name",
        "email",
        "address",
        "dateOfBirth",
        "highestQualification",
        "phone",
        "stateOfOrigin",
        "nationality",
        "nextOfKin.name",
        "nextOfKin.relationship",
        "nextOfKin.contact",
      ];
    } else if (step === 2) {
      fieldsToValidate = ["courses"];
    }

    // eslint-disable-next-line
    const valid = await trigger(fieldsToValidate as any);
    if (valid) {
      setStep((s) => Math.min(s + 1, 3));
      goToTop();
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = (values: StudentFormValues) => mutation.mutate(values);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center text-lg font-semibold mb-2">
        Step {step} of 3 — Student Registration
      </div>

      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 w-full max-w-lg mx-auto"
        >
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  {...register("name")}
                  placeholder="Full Name *"
                  className={cn(errors.name && "border-red-500")}
                />
                <InputError message={errors.name?.message} />
              </div>

              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  {...register("email")}
                  placeholder="Email *"
                  className={cn(errors.email && "border-red-500")}
                />
                <InputError message={errors.email?.message} />
              </div>

              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  {...register("address")}
                  placeholder="Address *"
                  className={cn(errors.address && "border-red-500")}
                />
                <InputError message={errors.address?.message} />
              </div>

              <div className="grid gap-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  {...register("dateOfBirth")}
                  className={cn(errors.dateOfBirth && "border-red-500")}
                />
                <InputError message={errors.dateOfBirth?.message} />
              </div>

              <div className="grid gap-2">
                <Label>Highest Qualification</Label>
                <Input
                  {...register("highestQualification")}
                  placeholder="Highest Qualification *"
                  className={cn(
                    errors.highestQualification && "border-red-500"
                  )}
                />
                <InputError message={errors.highestQualification?.message} />
              </div>

              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  {...register("phone")}
                  placeholder="Phone Number *"
                  className={cn(errors.phone && "border-red-500")}
                />
                <InputError message={errors.phone?.message} />
              </div>

              <div className="grid gap-2">
                <Label>State of Origin</Label>
                <Input
                  {...register("stateOfOrigin")}
                  placeholder="State of Origin *"
                  className={cn(errors.stateOfOrigin && "border-red-500")}
                />
                <InputError message={errors.stateOfOrigin?.message} />
              </div>

              <div className="grid gap-2">
                <Label>Nationality</Label>
                <Input
                  {...register("nationality")}
                  placeholder="Nationality *"
                  className={cn(errors.nationality && "border-red-500")}
                />
                <InputError message={errors.nationality?.message} />
              </div>

              <div className="grid gap-2">
                <Label>Next of Kin</Label>
                <Input
                  {...register("nextOfKin.name")}
                  placeholder="Name *"
                  className={cn(errors.nextOfKin?.name && "border-red-500")}
                />
                <InputError message={errors.nextOfKin?.name?.message} />
              </div>

              <div>
                <Input
                  {...register("nextOfKin.relationship")}
                  placeholder="Relationship *"
                  className={cn(
                    errors.nextOfKin?.relationship && "border-red-500"
                  )}
                />
                <InputError message={errors.nextOfKin?.relationship?.message} />
              </div>

              <div>
                <Input
                  {...register("nextOfKin.contact")}
                  placeholder="Contact *"
                  className={cn(errors.nextOfKin?.contact && "border-red-500")}
                />
                <InputError message={errors.nextOfKin?.contact?.message} />
              </div>
            </div>
          )}

          {/* STEP 2: Course Selection */}
          {step === 2 && <RegistrationCourses {...{ courses, form, errors }} />}

          {/* STEP 3: Additional Info */}
          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Occupation</Label>
                <Input
                  {...register("occupation")}
                  placeholder="Occupation *"
                  className={cn(errors.occupation && "border-red-500")}
                />
                <InputError message={errors.occupation?.message} />
              </div>

              <div className="grid gap-2">
                <Label>How did you hear about us?</Label>
                <Select
                  onValueChange={(v) => form.setValue("heardFrom", v)}
                  defaultValue={form.getValues("heardFrom")}
                >
                  <SelectTrigger
                    className={cn(errors.heardFrom && "border-red-500")}
                  >
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Google",
                      "Facebook",
                      "Twitter",
                      "Loctech Website",
                      "Radio",
                      "Billboard",
                      "Instagram",
                      "Flyers",
                      "Friends",
                      "Other",
                    ].map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError message={errors.heardFrom?.message} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={back}>
                Back
              </Button>
            )}
            {step < 3 && (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
