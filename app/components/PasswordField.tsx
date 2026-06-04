"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = {
  label: string;
  name: string;
  required?: boolean;
};

export function PasswordField({ label, name, required }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#4f5c55]">{label}</span>
      <span className="relative block">
        <input
          className="h-11 w-full rounded-md border border-[#ded4cb] px-3 pr-11 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          name={name}
          type={isVisible ? "text" : "password"}
          required={required}
        />
        <button
          aria-label={isVisible ? "Nascondi password" : "Mostra password"}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6c5f57] transition hover:bg-[#f8f1ec]"
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? (
            <EyeOff size={17} aria-hidden="true" />
          ) : (
            <Eye size={17} aria-hidden="true" />
          )}
        </button>
      </span>
    </label>
  );
}
