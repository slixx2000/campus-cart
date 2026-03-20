"use client";

import { useActionState } from "react";
import {
  approveStudentEmailAction,
  createStudentVerificationLinkAction,
  rejectStudentEmailAction,
} from "./actions";

type VerificationRow = {
  id: string;
  full_name: string;
  student_email: string | null;
  student_email_requested_at: string | null;
  student_email_verified_at: string | null;
  verification_review_note: string | null;
  verification_rejection_reason: string | null;
  is_verified_student: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-ZM", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function VerificationActions({ row }: { row: VerificationRow }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveStudentEmailAction,
    {}
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectStudentEmailAction,
    {}
  );
  const [linkState, linkAction, linkPending] = useActionState(
    createStudentVerificationLinkAction,
    {}
  );

  return (
    <div className="flex min-w-[260px] flex-col gap-3">
      <form action={approveAction} className="space-y-2">
        <input type="hidden" name="profileId" value={row.id} />
        <textarea
          name="note"
          rows={2}
          defaultValue={row.verification_review_note ?? ""}
          placeholder="Approval note (optional)"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
        <button
          type="submit"
          disabled={approvePending || row.is_verified_student}
          className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approvePending ? "Approving..." : row.is_verified_student ? "Approved" : "Approve"}
        </button>
      </form>

      <form action={rejectAction} className="space-y-2">
        <input type="hidden" name="profileId" value={row.id} />
        <textarea
          name="reason"
          rows={2}
          defaultValue={row.verification_rejection_reason ?? ""}
          placeholder="Rejection reason (required if rejecting)"
          className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-300 dark:border-red-300/20 dark:bg-[#0d1a2b] dark:text-white"
        />
        <button
          type="submit"
          disabled={rejectPending}
          className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-300/20 dark:text-red-200 dark:hover:bg-red-300/10"
        >
          {rejectPending ? "Rejecting..." : "Reject / clear"}
        </button>
      </form>

      <form action={linkAction} className="space-y-2">
        <input type="hidden" name="profileId" value={row.id} />
        <button
          type="submit"
          disabled={linkPending || !row.student_email}
          className="rounded-full border border-sky-200 px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-300/20 dark:text-sky-200 dark:hover:bg-sky-300/10"
        >
          {linkPending ? "Generating link..." : "Create verification link"}
        </button>
        {linkState.verificationLink ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-100">
            <p className="mb-2 font-semibold">Manual send link</p>
            <p className="break-all">{linkState.verificationLink}</p>
          </div>
        ) : null}
      </form>

      {(approveState.message || rejectState.message || linkState.message) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {approveState.message ?? rejectState.message ?? linkState.message}
        </p>
      )}
    </div>
  );
}

export default function AdminVerificationTable({ rows }: { rows: VerificationRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-[#0d1a2b] dark:text-slate-300">
        No pending student email requests right now.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
          <thead className="bg-slate-50 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">User</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Student email</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Requested</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Last review</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{row.full_name}</td>
                <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{row.student_email ?? "—"}</td>
                <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(row.student_email_requested_at)}</td>
                <td className="px-4 py-4 text-sm">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${row.is_verified_student ? "bg-green-100 text-green-700 dark:bg-emerald-300/10 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-100"}`}>
                    {row.is_verified_student ? "Verified" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                  {row.verification_rejection_reason ? (
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-200">Rejected</p>
                      <p>{row.verification_rejection_reason}</p>
                    </div>
                  ) : row.verification_review_note ? (
                    <div>
                      <p className="font-semibold text-green-700 dark:text-emerald-200">Approved note</p>
                      <p>{row.verification_review_note}</p>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <VerificationActions row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
