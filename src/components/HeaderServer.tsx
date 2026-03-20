import { createClient } from "@/lib/supabase/server";
import { getUnreadConversationsCount } from "@/lib/repositories/conversations";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVerifiedStudent = false;
  let isAdmin = false;
  const unreadMessages = user
    ? await getUnreadConversationsCount(user.id).catch(() => 0)
    : 0;

  if (user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified_student, is_admin")
        .eq("id", user.id)
        .single();
      isVerifiedStudent = profile?.is_verified_student === true;
      isAdmin = profile?.is_admin === true;
    } catch {
      // If profile fetch fails, default to false
      isVerifiedStudent = false;
      isAdmin = false;
    }
  }

  return (
    <HeaderClient
      user={user ? { id: user.id, email: user.email ?? "" } : null}
      isVerifiedStudent={isVerifiedStudent}
      isAdmin={isAdmin}
      unreadMessages={unreadMessages}
    />
  );
}
