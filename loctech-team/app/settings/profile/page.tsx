"use client";

import { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { Transition } from "@headlessui/react";

import HeadingSmall from "@/components/heading-small";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/settings/layout";

const breadcrumbs = [
  {
    title: "Profile settings",
    href: "/settings/profile",
  },
];

type ProfileForm = {
  name: string;
  email: string;
};

export default function ProfilePage() {
  // Replace these with actual user props (maybe from session/auth provider)
  const auth = {
    user: {
      name: "John Doe",
      email: "johndoe@example.com",
      email_verified_at: null,
    },
  };

  const [data, setData] = useState<ProfileForm>({
    name: auth.user.name,
    email: auth.user.email,
  });

  const [errors, setErrors] = useState<Partial<ProfileForm>>({});
  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);
  const [status] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setRecentlySuccessful(true);
        setTimeout(() => setRecentlySuccessful(false), 3000);
      } else {
        const err = await res.json();
        setErrors(err.errors || {});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

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
                className="mt-1 block w-full"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
                autoComplete="name"
                placeholder="Full name"
              />
              <InputError className="mt-2" message={errors.name} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                className="mt-1 block w-full"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
                autoComplete="username"
                placeholder="Email address"
              />
              <InputError className="mt-2" message={errors.email} />
            </div>

            {!auth.user.email_verified_at && (
              <div>
                <p className="-mt-4 text-sm text-muted-foreground">
                  Your email address is unverified.{" "}
                  <Link
                    href="/api/email/resend"
                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
                  >
                    Click here to resend the verification email.
                  </Link>
                </p>

                {status === "verification-link-sent" && (
                  <div className="mt-2 text-sm font-medium text-green-600">
                    A new verification link has been sent to your email address.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button disabled={processing}>Save</Button>

              <Transition
                show={recentlySuccessful}
                enter="transition ease-in-out"
                enterFrom="opacity-0"
                leave="transition ease-in-out"
                leaveTo="opacity-0"
              >
                <p className="text-sm text-neutral-600">Saved</p>
              </Transition>
            </div>
          </form>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
