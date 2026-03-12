import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/repositories/profiles";
import { createClient } from "@/lib/supabase/server";
import ProfileSettingsForm from "./ProfileSettingsForm";

export const metadata = { title: "Profile Settings – CampusCart" };

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/profile/settings");
  }

  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-background-light px-4 py-12 text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <ProfileSettingsForm initialAvatarUrl={profile?.avatar_url ?? null} />
      </div>
    </div>
  );
}
