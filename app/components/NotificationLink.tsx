"use client";

import Link from "next/link";
import { MouseEvent, ReactNode } from "react";

type NotificationLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
  notificationId: string;
};

export function NotificationLink({
  children,
  className,
  href,
  notificationId,
}: NotificationLinkProps) {
  function markAsRead(_event: MouseEvent<HTMLAnchorElement>) {
    fetch("/api/notifications/read", {
      body: JSON.stringify({ notificationId }),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => {});
  }

  return (
    <Link className={className} href={href} onClick={markAsRead}>
      {children}
    </Link>
  );
}
