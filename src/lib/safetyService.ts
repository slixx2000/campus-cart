import { createClient } from "@/lib/supabase/client";
import type { ReportType } from "@/types/database";

export type CreateReportInput = {
  reportType: ReportType;
  reportedUserId?: string;
  listingId?: string;
  conversationId?: string;
  reason: string;
  details?: string;
};

export async function blockUser(blockedUserId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { error } = await supabase.from("blocked_users").upsert(
    {
      blocker_id: user.id,
      blocked_id: blockedUserId,
    },
    { onConflict: "blocker_id,blocked_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function createReport(input: CreateReportInput): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: input.reportedUserId ?? null,
    listing_id: input.listingId ?? null,
    conversation_id: input.conversationId ?? null,
    report_type: input.reportType,
    reason: input.reason,
    details: input.details?.trim() ? input.details.trim() : null,
  });

  if (error) {
    throw new Error(error.message);
  }
}
