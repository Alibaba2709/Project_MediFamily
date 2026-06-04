import Link from "next/link";
import { Bell, FileText, Home, Users } from "lucide-react";
import { getCurrentUser } from "@/app/lib/auth";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reminders", label: "Promemoria", icon: Bell },
  { href: "/documents", label: "Archivio", icon: FileText },
  { href: "/settings", label: "Famiglia", icon: Users },
];

export async function MobileBottomNav() {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eadfd7] bg-[#fffdfb]/95 px-2 py-2 shadow-[0_-8px_24px_rgba(47,51,48,0.08)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold text-[#4f5c55] transition hover:bg-[#f8f1ec]"
              href={item.href}
              key={item.href}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
