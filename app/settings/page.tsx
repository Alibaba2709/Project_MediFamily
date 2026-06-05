import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import {
  getFamilyBookingSettings,
  getFamilyMembers,
  getFamilyNotificationSettings,
} from "@/app/lib/family";
import { FamilyMembersManager } from "@/app/components/FamilyMembersManager";
import { BookingSettingsForm } from "@/app/components/BookingSettingsForm";
import { NotificationSettingsForm } from "@/app/components/NotificationSettingsForm";
import { FamilyAccessManager } from "@/app/components/FamilyAccessManager";
import { ProfileImageControl } from "@/app/components/ProfileImageControl";
import { MemberHealthInfoForm } from "@/app/components/MemberHealthInfoForm";
import { User } from "@/app/models/User";
import { FamilyInvite } from "@/app/models/FamilyInvite";

type FamilyUser = {
  _id: { toString: () => string };
  name: string;
  email: string;
  role: "owner" | "member" | "viewer";
};

type StoredInvite = {
  _id: { toString: () => string };
  email: string;
  role: "member" | "viewer";
  expiresAt: Date;
};

async function getFamilyAccessData(familyId: string) {
  await connectMongo();

  const [users, invites] = await Promise.all([
    User.find({ familyId })
      .sort({ role: 1, name: 1 })
      .lean<FamilyUser[]>(),
    FamilyInvite.find({
      familyId,
      acceptedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean<StoredInvite[]>(),
  ]);

  return {
    users: users.map((familyUser) => ({
      id: familyUser._id.toString(),
      name: familyUser.name,
      email: familyUser.email,
      role: familyUser.role,
    })),
    invites: invites.map((invite) => ({
      id: invite._id.toString(),
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
    })),
  };
}

export default async function SettingsPage() {
  const user = await requireVerifiedUser();
  const members = await getFamilyMembers(user);
  const currentMember =
    members.find(
      (member) => member.name.toLowerCase() === user.name.toLowerCase()
    ) ?? members[0];
  const bookingSettings = await getFamilyBookingSettings(user);
  const notificationSettings = await getFamilyNotificationSettings(user);
  const accessData =
    user.role === "owner"
      ? await getFamilyAccessData(user.familyId)
      : { users: [], invites: [] };

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec]"
          href="/"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Dashboard
        </Link>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#faf7ff] text-[#5d527b]">
              <Settings size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Account e nucleo
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Impostazioni
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Gestisci il tuo profilo e le informazioni principali del nucleo
                familiare.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
              Profilo
            </h2>
            <div className="mt-4 flex items-start gap-3">
              <ProfileImageControl
                avatarClassName="size-14"
                avatarTextClassName="text-lg"
                hasImage={Boolean(currentMember?.imageDataUrl)}
                imageDataUrl={currentMember?.imageDataUrl}
                memberName={user.name}
                mode="avatar"
                name={user.name}
                tone={currentMember?.tone ?? "bg-[#f9d8d6]"}
              />
              <div className="min-w-0 space-y-3 text-sm">
                <p>
                  <span className="font-semibold text-[#29302d]">Nome:</span>{" "}
                  <span className="text-[#6c5f57]">{user.name}</span>
                </p>
                <p>
                  <span className="font-semibold text-[#29302d]">Email:</span>{" "}
                  <span className="text-[#6c5f57]">{user.email}</span>
                </p>
                <p>
                  <span className="font-semibold text-[#29302d]">Ruolo:</span>{" "}
                  <span className="text-[#6c5f57]">{user.role}</span>
                </p>
              </div>
            </div>
            {currentMember ? (
              <div className="mt-5 border-t border-[#eee5dd] pt-4">
                <h3 className="text-sm font-semibold uppercase text-[#7a6f68]">
                  Scheda sanitaria personale
                </h3>
                <div className="mt-3">
                  <MemberHealthInfoForm member={currentMember} />
                </div>
              </div>
            ) : null}
          </article>

          <article className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
            {user.role === "owner" ? (
              <FamilyMembersManager
                currentUserName={user.name}
                members={members}
              />
            ) : (
              <div>
                <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
                  Membri famiglia
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6c5f57]">
                  Solo il proprietario puo modificare i membri del nucleo.
                </p>
              </div>
            )}
          </article>

          {user.role === "owner" ? (
            <>
              <article className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm md:col-span-2">
                <FamilyAccessManager
                  currentUserId={user.id}
                  invites={accessData.invites}
                  users={accessData.users}
                />
              </article>

              <article className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm md:col-span-2">
                <BookingSettingsForm settings={bookingSettings} />
              </article>

              <article className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm md:col-span-2">
                <NotificationSettingsForm settings={notificationSettings} />
              </article>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
