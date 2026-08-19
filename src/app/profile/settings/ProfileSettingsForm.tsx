"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import AvatarPicker, { type AvatarSelection } from "@/components/AvatarPicker";
import { uploadProfileAvatar } from "@/lib/avatarService";
import {
  type ProfileSettingsState,
  linkStudentEmailAction,
  resendStudentVerificationAction,
  updatePhoneAction,
  updateProfileAvatarAction,
} from "./actions";

interface ProfileSettingsFormProps {
  initialAvatarUrl?: string | null;
  isVerifiedStudent?: boolean;
  studentEmail?: string | null;
  studentEmailRequestedAt?: string | null;
  studentEmailVerifiedAt?: string | null;
  verificationRejectionReason?: string | null;
  phone?: string | null;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat("en-ZM", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ProfileSettingsForm({
  initialAvatarUrl,
  isVerifiedStudent = false,
  studentEmail,
  studentEmailRequestedAt,
  studentEmailVerifiedAt,
  verificationRejectionReason,
  phone,
}: ProfileSettingsFormProps) {
  const [avatarState, avatarFormAction, avatarPending] = useActionState(
    updateProfileAvatarAction,
    {}
  );
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendStudentVerificationAction,
    {} as ProfileSettingsState
  );
  const [phoneState, phoneFormAction, phonePending] = useActionState(
    updatePhoneAction,
    {} as ProfileSettingsState
  );
  const [studentEmailState, studentEmailFormAction, studentEmailPending] = useActionState(
    linkStudentEmailAction,
    {} as ProfileSettingsState
  );
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>(
    initialAvatarUrl ? { type: "default", url: initialAvatarUrl } : { type: "none" }
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!avatarPending) {
      setIsUploading(false);
    }
  }, [avatarPending, avatarState]);

  const handleAvatarSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();

      if (avatarSelection.type === "upload") {
        const uploadedAvatarUrl = await uploadProfileAvatar(avatarSelection.file);
        formData.set("avatarUrl", uploadedAvatarUrl);
      } else if (avatarSelection.type === "default") {
        formData.set("avatarUrl", avatarSelection.url);
      } else {
        throw new Error("Choose a default avatar or upload a custom image.");
      }

      startTransition(() => {
        avatarFormAction(formData);
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "We could not update your avatar."
      );
      setIsUploading(false);
    }
  };

  const requestedAtLabel = formatDate(studentEmailRequestedAt);
  const verifiedAtLabel = formatDate(studentEmailVerifiedAt);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-surface p-8 dark:bg-surface">
        <span className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
          Seller Verification
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
          Link your student email to this account
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Link a student email from your university. We verify this to ensure only students can create listings. You can keep your personal email for browsing.
        </p>

        <div
          className={`mt-6 rounded-2xl border p-5 text-sm ${
            isVerifiedStudent
              ? "border-green-200 bg-green-50 text-green-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200"
              : studentEmail
              ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100"
              : "border-line bg-surface-2 text-slate-700   dark:text-slate-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5">
              {isVerifiedStudent ? "verified" : studentEmail ? "hourglass_top" : "school"}
            </span>
            <div>
              <p className="font-bold">
                {isVerifiedStudent
                  ? "You're verified! Ready to sell."
                  : studentEmail
                  ? "Email linked. Awaiting verification."
                  : "Browsing as a guest. Selling requires verification."}
              </p>
              <p className="mt-1 leading-6">
                {isVerifiedStudent
                  ? "You can now create listings and sell on CampusCart. Your verified badge will appear on all your listings."
                  : studentEmail
                  ? "Your student email is verified if your school is recognized. Approval typically takes 24 hours. You'll receive a notification when ready."
                  : "Link your university student email below to get verified for selling. We only approve verified students to keep CampusCart trustworthy."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-5">
          <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
            <p>
              <span className="font-bold">Linked student email:</span>{" "}
              {studentEmail ?? "Not linked yet"}
            </p>
            {requestedAtLabel && !isVerifiedStudent ? (
              <p>
                <span className="font-bold">Requested:</span> {requestedAtLabel}
              </p>
            ) : null}
            {verifiedAtLabel ? (
              <p>
                <span className="font-bold">Verified:</span> {verifiedAtLabel}
              </p>
            ) : null}
          </div>
        </div>

        {verificationRejectionReason && !isVerifiedStudent ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <p className="font-semibold">Your last request was rejected</p>
            <p className="mt-1 leading-6">{verificationRejectionReason}</p>
          </div>
        ) : null}

        {studentEmail && !isVerifiedStudent ? (
          <form action={resendFormAction} className="mt-4">
            <button
              type="submit"
              disabled={resendPending}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base leading-none">outgoing_mail</span>
              {resendPending ? "Sending…" : "Resend verification email"}
            </button>
            {resendState.message ? (
              <p className="mt-2 text-xs text-muted">{resendState.message}</p>
            ) : null}
            {resendState.manualLink ? (
              <a href={resendState.manualLink} className="mt-1 block text-xs text-accent underline">
                Open the verification link directly
              </a>
            ) : null}
          </form>
        ) : null}

        <form action={studentEmailFormAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Student Email
            </label>
            <input
              type="email"
              name="studentEmail"
              required
              defaultValue={studentEmail ?? ""}
              placeholder="you@zcasu.edu.zm"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              This links your student identity to your existing personal account. It does not
              change how you sign in.
            </p>
            {studentEmailState.errors?.studentEmail && (
              <p className="mt-1 text-xs text-red-500">
                {studentEmailState.errors.studentEmail[0]}
              </p>
            )}
          </div>

          {studentEmailState.message && (
            <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm text-fg">
              {studentEmailState.message}
              {studentEmailState.manualLink ? (
                <a
                  href={studentEmailState.manualLink}
                  className="mt-2 block text-xs text-accent underline"
                >
                  Open the verification link directly
                </a>
              ) : null}
            </div>
          )}

          <button
            type="submit"
            disabled={studentEmailPending}
            className="btn-primary px-6 text-sm disabled:opacity-60"
          >
            {studentEmailPending ? "Saving..." : studentEmail ? "Update student email" : "Link student email"}
          </button>
        </form>
      </div>

      <div className="card p-8">
        <span className="text-sm font-bold uppercase tracking-[0.28em] text-muted">
          Contact
        </span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
          Phone number
        </h2>
        <p className="mt-2 text-sm text-muted">
          Buyers reach you on WhatsApp or by calling this number. Without it, your
          listings show only the in-app Message button.
        </p>

        <form action={phoneFormAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-fg" htmlFor="phone">
              Zambian mobile number
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              required
              defaultValue={phone ?? ""}
              placeholder="097 123 4567"
              className="input"
            />
            {phoneState.errors?.phone ? (
              <p className="mt-1 text-xs text-danger">{phoneState.errors.phone[0]}</p>
            ) : null}
          </div>
          {phoneState.message ? (
            <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm text-fg">
              {phoneState.message}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={phonePending}
            className="btn-primary px-6 text-sm disabled:opacity-60"
          >
            {phonePending ? "Saving…" : "Save phone number"}
          </button>
        </form>
      </div>

      <form
        onSubmit={handleAvatarSubmit}
        className="space-y-6 rounded-lg border border-line bg-surface p-8 dark:bg-surface"
      >
        <div>
          <span className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
            Profile Settings
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            Update your profile picture
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Pick a default profile icon or upload a custom image. Uploaded avatars are
            compressed automatically before they are saved.
          </p>
        </div>

        <AvatarPicker initialAvatarUrl={initialAvatarUrl} onChange={setAvatarSelection} />

        {(localError || avatarState.message) && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              avatarState.errors || localError
                ? "border-red-200 bg-red-50 text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200"
                : "border-green-200 bg-green-50 text-green-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200"
            }`}
          >
            {localError ?? avatarState.message}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/profile"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-surface-2 dark:text-slate-200 dark:hover:bg-surface"
          >
            Back to profile
          </Link>
          <button
            type="submit"
            disabled={avatarPending || isUploading}
            className="btn-primary px-6 text-sm disabled:opacity-60"
          >
            {avatarPending || isUploading ? "Saving..." : "Save avatar"}
          </button>
        </div>
      </form>
    </div>
  );
}
