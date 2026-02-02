"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState } from "react";
import { toast } from "sonner";

interface SignInWithCodeProps {
  onCodeSubmit: (code: string) => void;
}

export function SignInWithCode({ onCodeSubmit }: SignInWithCodeProps) {
  const [code, setCode] = useState<string>("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (code.length < 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    onCodeSubmit(code);
    setCode("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Use Code</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Code</DialogTitle>
        </DialogHeader>
        <div className="centered">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value)}
            onComplete={(code) => {
              onCodeSubmit(code);
              setCode("");
              setOpen(false);
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={code.length < 6}
            onClick={handleSubmit}
          >
            Sign in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
