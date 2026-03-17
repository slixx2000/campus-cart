import { createClient } from "@/lib/supabase/server";
import MessageToastProvider from "./MessageToastProvider";

/** Server wrapper that gates the toast provider on authentication. */
export default async function NotificationServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return <MessageToastProvider userId={user.id} />;
}
