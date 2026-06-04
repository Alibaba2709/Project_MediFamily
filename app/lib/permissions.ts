import { NextResponse } from "next/server";
import { CurrentUser } from "@/app/lib/auth";

export function canEditHealth(user: CurrentUser) {
  return user.role === "owner" || user.role === "member";
}

export function canManageFamily(user: CurrentUser) {
  return user.role === "owner";
}

export function forbidden(message = "Non hai i permessi per questa azione.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
