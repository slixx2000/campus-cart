import { getSupabaseClient } from "@/lib/supabase";

type ReportType = "listing" | "user";

type CreateReportInput = {
  reportType: ReportType;
  listingId?: string;
  reportedUserId?: string;
  reason: string;
};

async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

async function createReport(input: CreateReportInput): Promise<void> {
  const supabase = getSupabaseClient();
  const reporterId = await getCurrentUserId();

  if (!reporterId) {
    throw new Error("You must sign in to submit a report.");
  }

  if (input.reportType === "user" && input.reportedUserId === reporterId) {
    throw new Error("You cannot report your own account.");
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_user_id: input.reportedUserId ?? null,
    listing_id: input.listingId ?? null,
    conversation_id: null,
    report_type: input.reportType,
    reason: input.reason.trim(),
    details: null,
  });

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new Error("You have already submitted this report.");
    }

    throw new Error(error.message);
  }
}

export async function reportListing(listingId: string, reason: string): Promise<void> {
  await createReport({
    reportType: "listing",
    listingId,
    reason,
  });
}

export async function reportUser(reportedUserId: string, reason: string): Promise<void> {
  await createReport({
    reportType: "user",
    reportedUserId,
    reason,
  });
}