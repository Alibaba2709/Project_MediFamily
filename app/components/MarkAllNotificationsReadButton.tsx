"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck } from "lucide-react";

type MarkAllNotificationsReadButtonProps = {
  notificationIds: string[];
};

export function MarkAllNotificationsReadButton({
  notificationIds,
}: MarkAllNotificationsReadButtonProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const hasNotifications = notificationIds.length > 0;

  async function markAllAsRead() {
    if (!hasNotifications || isSaving) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/notifications/read-all", {
        body: JSON.stringify({ notificationIds }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7e4dc] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] shadow-sm transition hover:bg-[#eef8f1] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!hasNotifications || isSaving}
      onClick={markAllAsRead}
      type="button"
    >
      <CheckCheck size={16} aria-hidden="true" />
      {isSaving ? "Segno..." : "Segna tutte come lette"}
    </button>
  );
}
