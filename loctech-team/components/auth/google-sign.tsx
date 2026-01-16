"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import GoogleLogoIcon from "../google-logo-icon";

const isGoogleSignOn =
  process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN != null &&
  process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN === "yes";
const GoogleSignIn = () => {
  const handleClick = () => {
    signIn("google", {
      redirect: false,
    }).then((value) => {
      console.log(value);
    });
  };

  return isGoogleSignOn ? (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={handleClick}
    >
      <GoogleLogoIcon className="h-5 w-5" />
      Sign in with Google
    </Button>
  ) : null;
};

export default GoogleSignIn;
