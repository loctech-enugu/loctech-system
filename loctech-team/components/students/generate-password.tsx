import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const GeneratePassword = () => {
  const router = useRouter();
  const { mutate: generatePassword, isPending } = useMutation({
    mutationFn: async () => {
      await fetch("/api/students/generate-password", { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Password generated");
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to generate password. Try again.");
    },
  });
  return (
    <Button onClick={() => generatePassword()} disabled={isPending}>
      {isPending ? "Generating..." : "Generate Password"}
    </Button>
  );
};
export default GeneratePassword;
