"use client";

import { useActionState } from "react";
import {
  approveStudentEmailAction,
  rejectStudentEmailAction,
} from "./actions";

type VerificationRow = {
  id: string;
  full_name: string;
  student_email: string | null;
  student_email_requested_at: string | null;
  student_email_verified_at: string | null;
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

function VerificationActions({ profileId, isVerified }: { profileId: string; isVerified: boolean }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveStudentEmailAction,
    {}
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectStudentEmailAction,
    {}
  );

  return (
    <div className="flex flex-col items-start gap-3">
      <form action={approveAction}>
        <input type="hidden" name="profileId" value={profileId} />
        <button
          type="submit"
          disabled={approvePending || isVerified}
          className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approvePending ? "Approving..." : isVerified ? "Approved" : "Approve"}
        </button>
      </form>

      <form action={rejectAction}>
        <input type="hidden" name="profileId" value={profileId} />
        <button
          type="submit"
          disabled={rejectPending}
          className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-300/20 dark:text-red-200 dark:hover:bg-red-300/10"
        >
          {rejectPending ? "Rejecting..." : "Reject / clear"}
        </button>
      </form>

      {(approveState.message || rejectState.message) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {approveState.message ?? rejectState.message}
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
                <td className="px-4 py-4">
                  <VerificationActions profileId={row.id} isVerified={row.is_verified_student} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
