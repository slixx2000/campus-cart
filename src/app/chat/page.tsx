import { redirect } from "next/navigation";

// `/chat` and `/messages` were two route trees rendering the same components,
// so "Message Seller" landed on /chat/* while the nav pointed at /messages/*.
// /messages is canonical; this keeps old links and bookmarks working.
export default function ChatIndexRedirect() {
  redirect("/messages");
}
