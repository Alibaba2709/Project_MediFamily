"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Home,
  ListChecks,
  Pill,
  PlayCircle,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";

const STORAGE_KEY = "medifamily_icon_guide_seen_v1";

const guideGroups = [
  {
    title: "Navigazione principale",
    items: [
      {
        label: "Home",
        text: "torna alla dashboard con agenda, riepiloghi e nucleo.",
        href: "/",
        icon: Home,
      },
      {
        label: "Promemoria",
        text: "vedi cosa richiede attenzione: visite, terapie e scadenze.",
        href: "/reminders",
        icon: Bell,
      },
      {
        label: "Archivio",
        text: "apri documenti, ricette, farmaci e pagamenti salvati.",
        href: "/archive",
        icon: FileText,
      },
      {
        label: "Famiglia",
        text: "gestisci membri, profili sanitari, accessi e impostazioni.",
        href: "/settings",
        icon: Users,
      },
    ],
  },
  {
    title: "Cosa significano le icone",
    items: [
      {
        label: "Calendario",
        text: "visite prenotate, orari e appuntamenti futuri.",
        href: "/calendar",
        icon: CalendarDays,
      },
      {
        label: "Carta",
        text: "pagamenti, ticket e ricevute collegate alle visite.",
        href: "/payments",
        icon: CreditCard,
      },
      {
        label: "Orologio",
        text: "disdette, scadenze e cose da fare entro una data.",
        href: "/reminders",
        icon: Clock3,
      },
      {
        label: "Capsula",
        text: "farmaci, terapie, dosaggi, orari e scorte.",
        href: "/medications",
        icon: Pill,
      },
      {
        label: "Documento",
        text: "referti, ricette, allegati e archivio salute.",
        href: "/documents",
        icon: FileText,
      },
      {
        label: "Lente",
        text: "cerca velocemente tra visite, farmaci, ricette e documenti.",
        href: "/",
        icon: Search,
      },
    ],
  },
  {
    title: "Azioni utili",
    items: [
      {
        label: "Fotocamera",
        text: "cambia o rimuovi l'immagine profilo di un familiare.",
        href: "/settings",
        icon: Camera,
      },
      {
        label: "Impostazioni",
        text: "cambia email, password, portale prenotazioni e notifiche.",
        href: "/settings",
        icon: Settings,
      },
      {
        label: "Collegamento esterno",
        text: "apre il portale prenotazioni della tua regione, se impostato.",
        href: "/settings",
        icon: ExternalLink,
      },
    ],
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
                  Guida rapida
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
                  Cosa significano le icone.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                  Una piccola mappa per orientarti nella dashboard e capire
                  dove andare per ogni funzione.
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

            <div className="p-5">
              <div className="mb-4 rounded-lg border border-[#eadfd7] bg-[#fffaf6] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#315a45] shadow-sm">
                      <PlayCircle size={24} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#29302d]">
                        Filmato guida
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
                        Qui potremo mettere un video breve che mostra la
                        dashboard e le icone principali.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex h-9 items-center justify-center rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#7a6f68]">
                    In arrivo
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                {guideGroups.map((group) => (
                  <section key={group.title}>
                    <h3 className="text-xs font-semibold uppercase text-[#947b6a]">
                      {group.title}
                    </h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            className="group flex items-start gap-3 rounded-lg border border-[#eadfd7] bg-white p-3 transition hover:bg-[#fffaf6]"
                            href={item.href}
                            key={`${group.title}-${item.label}`}
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f6fbf7] text-[#315a45] transition group-hover:bg-[#eaf4ee]">
                              <Icon size={19} aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#29302d]">
                                {item.label}
                              </span>
                              <span className="mt-1 block text-sm leading-5 text-[#6c5f57]">
                                {item.text}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="border-t border-[#eee5dd] bg-[#fffdfb] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#315a45]">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Il simbolo assistenza resta in basso a destra.
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
