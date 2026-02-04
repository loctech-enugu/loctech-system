"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import validator from "validator";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import InputError from "../input-error";
import { cn } from "@/lib/utils";

import type { User } from "@/types";
import { toast } from "sonner";
import GetBankInfos from "../bank-detail";

// API call
async function createUser(data: Partial<User>) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const response = await res.json();
  if (!res.ok) throw new Error(response.error || "Failed to create user");
  return response;
}

export default function AddUserModal() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User added successfully");
      formRef.current?.reset();
      router.refresh(); // refresh list after creation
    },
    onError: (err) => {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  const validateForm = (formData: FormData): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      role?: string;
      phone?: string;
    } = {};

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const phone = formData.get("phone") as string;

    if (validator.isEmpty(name || "")) {
      newErrors.name = "Name is required.";
    }
    if (validator.isEmpty(email || "")) {
      newErrors.email = "Email is required.";
    } else if (!validator.isEmail(email)) {
      newErrors.email = "Invalid email address.";
    }
    if (validator.isEmpty(role || "")) {
      newErrors.role = "Role is required.";
    }
    if (validator.isEmpty(phone || "")) {
      newErrors.phone = "Phone number is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const proceed = (formData: FormData) => {
    if (!validateForm(formData)) return;

    const bank_name = formData.get("bank_name") as string | undefined;
    const account_name = formData.get("account_name") as string | undefined;
    const account_number = formData.get("account_number") as string | undefined;
    const payload: Partial<User> = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as User["role"],
      title: (formData.get("title") as string) || undefined,
      isActive: formData.get("isActive") === "true",
      bankDetails: {
        bankName: bank_name,
        accountNumber: account_number,
        accountHolder: account_name,
      },
    };

    mutation.mutate(payload);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    proceed(formData);
  };

  const handleClick = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    proceed(formData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add User</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[98vh]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new user.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="space-y-4"
          noValidate
        >
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              className={cn(errors.name && "border-red-500")}
            />
            <InputError message={errors.name} />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="johndoe@example.com"
              className={cn(errors.email && "border-red-500")}
            />
            <InputError message={errors.email} />
          </div>
          {/* Phone number */}
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="08100000000"
              className={cn(errors.phone && "border-red-500")}
            />
            <InputError message={errors.phone} />
          </div>

          {/* Role */}
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role">
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.role} />
          </div>

          {/* Title (optional) */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" name="title" placeholder="Manager / Engineer" />
          </div>
          <GetBankInfos errors={errors} />

          {/* Active status */}
          <div className="flex items-center gap-2">
            <Switch id="isActive" name="isActive" value="true" defaultChecked />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <button type="submit" className="hidden" />
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>

          <Button
            type="submit"
            disabled={mutation.isPending}
            onClick={handleClick}
          >
            {mutation.isPending ? "Adding..." : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
