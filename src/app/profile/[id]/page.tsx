import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import AvatarImage from "@/components/AvatarImage";
import { getProfileById } from "@/lib/repositories/profiles";
import { getListingsByUser } from "@/lib/repositories/listings";
import { dbListingToUi } from "@/lib/mappers";
import ProfileTabs from "./ProfileTabs";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileById(id);
  return {
    title: profile ? `${profile.full_name} – CampusCart` : "Profile – CampusCart",
  };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  const profile = await getProfileById(id);
  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === id;

  const { data: university } = profile.university_id
    ? await supabase
        .from("universities")
        .select("name, short_name")
        .eq("id", profile.university_id)
        .single()
    : { data: null };

  const allListings = await getListingsByUser(id);
  const activeListings = allListings
    .filter((l) => l.status === "active")
    .map(dbListingToUi);
  const soldCount = allListings.filter((l) => l.status === "sold").length;

  const memberSince = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(new Date(profile.created_at));

  return (
    <div className="min-h-screen bg-background-light text-slate-900 transition-colors dark:bg-background-dark dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">

        {/* ── Profile header card ── */}
        <div className="mb-8 rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur md:p-10 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_35px_120px_-55px_rgba(8,15,33,0.95)]">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="size-32 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-xl dark:border-slate-800 md:size-40">
                <AvatarImage
                  alt={profile.full_name}
                  src={profile.avatar_url}
                  className="h-full w-full object-cover"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-300"
                />
              </div>
              <div className="absolute bottom-2 right-2 size-5 rounded-full border-4 border-white bg-green-500 dark:border-slate-800" />
            </div>

            {/* Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-2 flex flex-col items-center gap-3 md:flex-row">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {profile.full_name}
                </h1>
                {profile.is_pioneer_seller && (
                  <span className="inline-flex items-center gap-1 self-center rounded-full border border-amber-300/60 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/15 dark:text-amber-300">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Pioneer Seller
                  </span>
                )}
                {profile.is_verified_student && (
                  <span className="inline-flex items-center gap-1 self-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:border-sky-300/30 dark:bg-sky-300/10 dark:text-sky-300">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Verified Student
                  </span>
                )}
              </div>

              {university && (
                <p className="mb-4 font-medium text-slate-500 dark:text-slate-400">
                  {university.short_name} – {university.name}
                </p>
              )}

              {/* Stats */}
              <div className="mb-6 flex flex-wrap justify-center gap-6 md:justify-start">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {activeListings.length}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Active
                  </span>
                </div>
                <div className="hidden h-10 w-px self-center bg-slate-200 dark:bg-slate-700 sm:block" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {soldCount}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Items Sold
                  </span>
                </div>
              </div>

              {/* Actions */}
              {isOwnProfile ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/sell"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/45 bg-gradient-to-r from-primary to-sky-400 px-6 py-2.5 text-sm font-bold text-sky-950 shadow-lg shadow-primary/25 transition hover:opacity-90 dark:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    New Listing
                  </Link>
                  <Link
                    href="/profile/settings"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    Profile Settings
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110 dark:bg-gradient-to-r dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950">
                    <span className="material-symbols-outlined text-sm">chat</span>
                    Message
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15">
                    <span className="material-symbols-outlined text-sm">share</span>
                    Share Profile
                  </button>
                </div>
              )}
            </div>

            {/* Member since (desktop) */}
            <div className="hidden text-right lg:block">
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                Member since
              </p>
              <p className="font-bold text-slate-600 dark:text-slate-300">{memberSince}</p>
            </div>
          </div>
        </div>

        {/* ── Tabs + content ── */}
        <ProfileTabs activeListings={activeListings} isOwnProfile={isOwnProfile} />

        {isOwnProfile ? (
          <section className="mt-10 rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Account Session</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign out from this account when you are done using CampusCart.
                </p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 px-5 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-300/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
