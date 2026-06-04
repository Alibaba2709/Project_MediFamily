import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-8 text-[#2f3330] sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
        <section className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/medifamily-logo-symbol.png"
              alt="MediFamily"
              width={760}
              height={650}
              priority
              className="h-16 w-auto object-contain"
            />
            <span>
              <span
                className="block text-2xl font-bold leading-tight text-[#5573ad]"
                style={{
                  fontFamily:
                    '"Arial Rounded MT Bold", "Avenir Next Rounded", var(--font-geist-sans), sans-serif',
                }}
              >
                Med
                <span className="relative inline-block pr-0.5">
                  ı
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs leading-none text-[#ef8580]"
                    aria-hidden="true"
                  >
                    ♥
                  </span>
                </span>
                <span className="text-[#82c79b]">Family</span>
              </span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em]">
                <span className="text-[#82c79b]">La salute</span>{" "}
                <span className="text-[#8fa4d8]">di chi ami,</span>{" "}
                <span className="text-[#ef8580]">organizzata.</span>
              </span>
            </span>
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#947b6a]">
              Family mode
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-[#29302d] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#6c5f57]">
              {subtitle}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm sm:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}
