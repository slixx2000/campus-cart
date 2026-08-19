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
    <div className="min-h-screen bg-bg px-4 py-12 text-fg">
      <div className="mx-auto max-w-3xl">
        <ProfileSettingsForm
          initialAvatarUrl={profile?.avatar_url ?? null}
          isVerifiedStudent={profile?.is_verified_student ?? false}
          studentEmail={profile?.student_email ?? null}
          studentEmailRequestedAt={profile?.student_email_requested_at ?? null}
          studentEmailVerifiedAt={profile?.student_email_verified_at ?? null}
          verificationRejectionReason={profile?.verification_rejection_reason ?? null}
          phone={profile?.phone ?? null}
        />
      </div>
    </div>
  );
}
