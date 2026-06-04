"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export type SearchItem = {
  id: string;
  type: "Visita" | "Ricetta" | "Farmaco" | "Documento";
  title: string;
  detail: string;
  memberName: string;
  href: string;
  searchText: string;
};

type GlobalSearchProps = {
  items: SearchItem[];
};

export function GlobalSearch({ items }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (normalizedQuery.length < 2) return [];

    return items
      .filter((item) => item.searchText.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [items, normalizedQuery]);

  return (
    <section className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Search size={18} className="text-[#789888]" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
          Cerca in famiglia
        </h2>
      </div>

      <input
        className="h-11 w-full rounded-md border border-[#ded4cb] bg-[#fffdfb] px-3 text-sm outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
        placeholder="Cerca medico, farmaco, codice ricetta, documento, note..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {normalizedQuery.length >= 2 ? (
        <div className="mt-3 grid gap-2">
          {results.length > 0 ? (
            results.map((item) => (
              <Link
                className="rounded-md border border-[#eee5dd] bg-[#fffaf6] px-3 py-2 transition hover:bg-[#f8f1ec]"
                href={item.href}
                key={`${item.type}-${item.id}`}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#4f5c55]">
                    {item.type}
                  </span>
                  <span className="text-sm font-semibold text-[#29302d]">
                    {item.title}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#6c5f57]">
                  {item.memberName} · {item.detail}
                </span>
              </Link>
            ))
          ) : (
            <p className="rounded-md bg-[#fffaf6] px-3 py-2 text-sm text-[#6c5f57]">
              Nessun risultato trovato.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
