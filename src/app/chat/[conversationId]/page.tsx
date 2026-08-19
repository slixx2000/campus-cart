import { redirect } from "next/navigation";

export default async function ChatThreadRedirect({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  redirect(`/messages/${conversationId}`);
}
