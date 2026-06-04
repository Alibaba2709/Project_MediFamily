"use client";

import { Download, Printer } from "lucide-react";

type PrintButtonProps = {
  pdfHref: string;
};

export function PrintButton({ pdfHref }: PrintButtonProps) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] shadow-sm transition hover:bg-[#edf6ef]"
        onClick={() => window.print()}
        type="button"
      >
        <Printer size={16} aria-hidden="true" />
        Stampa
      </button>
      <a
        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274737]"
        href={pdfHref}
      >
        <Download size={16} aria-hidden="true" />
        Scarica PDF
      </a>
    </div>
  );
}
