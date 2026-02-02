"use client";
import Lottie from "lottie-react";
import signature from "@/assets/loaders/signature.json";
import signatureDark from "@/assets/loaders/signature-dark.json";
import { useTheme } from "next-themes";

const SignatureLoader = () => {
  const { theme } = useTheme();
  const animationData = theme === "light" ? signature : signatureDark;

  return (
    <div className="flex justify-center items-center py-8">
      <Lottie
        animationData={animationData}
        loop={true}
        autoPlay={true}
        className="size-20 md:size-50"
      ></Lottie>
    </div>
  );
};

export default SignatureLoader;
