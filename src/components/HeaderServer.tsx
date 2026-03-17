import { createClient } from "@/lib/supabase/server";
import { getUnreadConversationsCount } from "@/lib/repositories/conversations";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const unreadMessages = user
    ? await getUnreadConversationsCount(user.id).catch(() => 0)
    : 0;

  return (
    <HeaderClient
      user={user ? { id: user.id, email: user.email ?? "" } : null}
      unreadMessages={unreadMessages}
    />
  );
}
