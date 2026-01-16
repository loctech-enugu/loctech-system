"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import CustomSelect from "../form-select.component";
import InputError from "../input-error";

interface Bank {
  id: number;
  code: string;
  name: string;
}

interface GetBankInfosProps {
  errors: { [key: string]: string | undefined };
}
export default function GetBankInfos({ errors }: GetBankInfosProps) {
  const [bank, setBank] = useState<{
    bank_code: string;
    bank_name: string;
    account_number?: string;
  }>({
    bank_code: "",
    bank_name: "",
    account_number: "",
  });

  const [details, setDetails] = useState({
    account_name: "",
    account_number: "",
    bank_id: 0,
  });

  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch list of banks
  const { data: banks, isLoading: banksLoading } = useQuery<Bank[]>({
    queryKey: ["banks"],
    queryFn: async () => {
      const headers = { "Content-Type": "application/json" };
      const req = await fetch(`https://api.cusorcart.com/api/banks`, {
        headers,
      });
      const res = await req.json();
      return res.data ?? [];
    },
  });

  // ✅ Resolve bank details mutation
  const resolveBankMutation = useMutation({
    mutationFn: async (payload: typeof bank) => {
      const headers = { "Content-Type": "application/json" };
      const req = await fetch(`https://api.cusorcart.com/api/banks/resolve`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      return req.json();
    },
    onSuccess: (res) => {
      if (res?.data) {
        setDetails(res.data);
        setError(null);
      }
      if (res?.error) {
        setError(res.error);
      }
    },
    onError: () => {
      setError("Unable to verify account details");
    },
  });

  // ✅ Auto verify when account_number reaches 10 digits
  useEffect(() => {
    if (bank.account_number?.length === 10 && bank.bank_code) {
      resolveBankMutation.mutate(bank);
    } // eslint-disable-next-line
  }, [bank.account_number, bank.bank_code]);

  return (
    <div className="space-y-4">
      {/* Hidden input for bank name */}
      <input type="hidden" name="bank_name" value={bank.bank_name} />

      {/* Bank Select */}
      <div className="grid gap-2">
        <Label htmlFor="bank_code">Store Bank Name</Label>
        <CustomSelect
          placeholder="Choose your Bank Account"
          name="bank_code"
          options={
            banks != null
              ? banks.map((bank) => ({ value: bank.code, label: bank.name }))
              : undefined
          }
          onChange={(data) =>
            data != null &&
            setBank((prevFormData) => ({
              ...prevFormData,
              bank_code: data.value,
              bank_name: data.label,
            }))
          }
          isSearchable
          isLoading={banksLoading}
        />
        {/* <Select
          onValueChange={(val) => {
            const selected = banks?.find((b) => b.code === val);
            if (selected) {
              setBank((prev) => ({
                ...prev,
                bank_code: selected.code,
                bank_name: selected.name,
              }));
            }
          }}
          disabled={banksLoading}
        >
          <SelectTrigger
            id="bank_code"
            // className={cn(errors.bank_code && "border-red-500")}
          >
            <SelectValue placeholder="Choose your Bank Account" />
          </SelectTrigger>
          <SelectContent>
            {banks?.map((b) => (
              <SelectItem key={b.code} value={b.code}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}
        {/* <InputError message={errors.bank_code} /> */}
      </div>

      {/* Account Number Input */}
      <div className="grid gap-2">
        <Label htmlFor="account_number">Store Account Number</Label>
        <Input
          id="account_number"
          type="text"
          name="account_number"
          placeholder="Enter Your Account Number"
          maxLength={10}
          value={bank.account_number ?? ""}
          onChange={(e) =>
            setBank((prev) => ({
              ...prev,
              account_number: e.target.value.replace(/\D/g, ""),
            }))
          }
          readOnly={!bank.bank_code}
        />
        <InputError message={error || errors.account_number} />
      </div>

      {/* Account Name (auto filled if valid) */}
      {details.account_name && (
        <div className="grid gap-2">
          <Label htmlFor="account_name">Store Account Name</Label>
          <Input
            id="account_name"
            type="text"
            name="account_name"
            value={details.account_name}
            readOnly
            // className={cn(errors.account_name && "border-red-500")}
          />
          {/* <InputError message={errors.account_name} /> */}
        </div>
      )}

      {/* Loader */}
      {resolveBankMutation.isPending && (
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying account…
        </div>
      )}
    </div>
  );
}
