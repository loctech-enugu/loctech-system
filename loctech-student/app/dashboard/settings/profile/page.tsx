"use client";

import { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";

import HeadingSmall from "@/components/heading-small";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/settings/layout";
import { SpinnerLoader } from "@/components/spinner";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const breadcrumbs = [
  {
    title: "Profile settings",
    href: "/dashboard/settings/profile",
  },
];

type ProfileForm = {
  name: string;
  email: string;
  phone?: string;
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [data, setData] = useState<ProfileForm>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: (session?.user as any)?.phone || "",
  });
  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Profile updated successfully");
        setRecentlySuccessful(true);
        setTimeout(() => setRecentlySuccessful(false), 3000);
        await update(); // Refresh session
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating your profile");
    } finally {
      setProcessing(false);
    }
  };

  if (!session) {
    return (
      <SpinnerLoader
        title="Loading"
        message="Please wait while we load your profile."
      />
    );
  }
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head>
        <title>Profile settings</title>
      </Head>

      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall
            title="Profile information"
            description="Update your name and email address"
          />

          <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
                autoComplete="name"
                placeholder="Full name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
                autoComplete="username"
                placeholder="Email address"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone || ""}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                autoComplete="tel"
                placeholder="Phone number"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button disabled={processing}>
                {processing ? "Saving..." : "Save Changes"}
              </Button>

              {recentlySuccessful && (
                <p className="text-sm text-green-600">Saved</p>
              )}
            </div>
          </form>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
