"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  ListChecks,
  Pill,
  PlayCircle,
  Users,
  X,
} from "lucide-react";

const STORAGE_KEY = "medifamily_onboarding_seen_v1";

const steps = [
  {
    title: "Controlla il nucleo",
    text: "Aggiungi familiari e compila le informazioni essenziali.",
    href: "/settings",
    action: "Vai a Famiglia",
    icon: Users,
  },
  {
    title: "Salva la prima visita",
    text: "Inserisci data, orario, ticket e scadenza di disdetta.",
    href: "/",
    action: "Aggiungi visita",
    icon: CalendarDays,
  },
  {
    title: "Carica documenti",
    text: "Collega ricette, ricevute e referti al familiare corretto.",
    href: "/archive",
    action: "Apri archivio",
    icon: FileText,
  },
  {
    title: "Imposta una terapia",
    text: "Aggiungi farmaci, orari e scorte da tenere sotto controllo.",
    href: "/medications",
    action: "Vai a terapie",
    icon: Pill,
  },
];

export function OnboardingAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, "true");
      window.setTimeout(() => setIsOpen(true), 350);
    }
  }, []);

  return (
    <>
      <button
        aria-label="Apri assistente MediFamily"
        className="fixed bottom-20 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-[#315a45] text-white shadow-lg transition hover:bg-[#274737] md:bottom-6 md:right-6"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <ListChecks size={22} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-[#29302d]/25 px-3 py-3 backdrop-blur-sm sm:items-center sm:justify-center sm:px-5">
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#eadfd7] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#eee5dd] p-5">
              <div>
                <p className="text-sm font-semibold uppercase text-[#947b6a]">
                  Prima volta?
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
                  Ti accompagno nei primi passi.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                  Segui questa mini guida per capire subito dove mettere visite,
                  documenti, terapie e profili famiglia.
                </p>
              </div>
              <button
                aria-label="Chiudi assistente"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-[#6c5f57] transition hover:bg-[#f8f1ec]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    className="rounded-lg border border-[#eadfd7] bg-[#fffaf6] p-4"
                    key={step.title}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-[#315a45] shadow-sm">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#29302d]">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
                          {step.text}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="inline-flex h-9 items-center justify-center rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white transition hover:bg-[#274737]"
                        href={step.href}
                        onClick={() => setIsOpen(false)}
                      >
                        {step.action}
                      </Link>
                      <button
                        className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#7a6f68] opacity-80"
                        disabled
                        type="button"
                      >
                        <PlayCircle size={16} aria-hidden="true" />
                        Filmato in arrivo
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="border-t border-[#eee5dd] bg-[#fffdfb] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#315a45]">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Il simbolo assistenza resta sempre in basso a destra.
                </p>
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#e3d7cf] bg-white px-4 text-sm font-semibold text-[#4f5c55] transition hover:bg-[#f8f1ec]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Ho capito
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
