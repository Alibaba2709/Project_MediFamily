import Link from "next/link";
import { Bell } from "lucide-react";

type NotificationBellProps = {
  unreadCount: number;
};

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  return (
    <Link
      aria-label={
        unreadCount > 0
          ? `${unreadCount} notifiche non lette`
          : "Nessuna notifica non letta"
      }
      className="relative flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec]"
      href="/reminders"
    >
      <Bell size={17} aria-hidden="true" />
      <span className="hidden min-[390px]:inline">Notifiche</span>
      {unreadCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-[#ef8580] px-1.5 text-[11px] font-bold leading-5 text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
