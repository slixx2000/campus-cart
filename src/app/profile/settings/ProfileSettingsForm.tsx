"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import AvatarPicker, { type AvatarSelection } from "@/components/AvatarPicker";
import { uploadProfileAvatar } from "@/lib/avatarService";
import { updateProfileAvatarAction } from "./actions";

interface ProfileSettingsFormProps {
  initialAvatarUrl?: string | null;
  isVerifiedStudent?: boolean;
}

export default function ProfileSettingsForm({
  initialAvatarUrl,
  isVerifiedStudent = false,
}: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAvatarAction, {});
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>(
    initialAvatarUrl ? { type: "default", url: initialAvatarUrl } : { type: "none" }
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!pending) {
      setIsUploading(false);
    }
  }, [pending, state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
        formAction(formData);
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "We could not update your avatar."
      );
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-white/5"
    >
      <div>
        <span className="text-sm font-bold uppercase tracking-[0.28em] text-primary dark:text-sky-300">
          Profile Settings
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
          Update your profile picture
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Pick a default profile icon or upload a custom image. Uploaded avatars are
          compressed automatically before they are saved.
        </p>
      </div>

      <div
        className={`rounded-2xl border p-5 text-sm ${
          isVerifiedStudent
            ? "border-green-200 bg-green-50 text-green-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200"
            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5">
            {isVerifiedStudent ? "verified" : "school"}
          </span>
          <div>
            <p className="font-bold">
              {isVerifiedStudent
                ? "Your student seller access is active."
                : "Your account can browse, but selling requires student verification."}
            </p>
            <p className="mt-1 leading-6">
              {isVerifiedStudent
                ? "You can create listings and offer services on CampusCart."
                : "If your backend verification flow is already connected, complete or link your student email through that flow. Once approved, selling will unlock automatically."}
            </p>
          </div>
        </div>
      </div>

      <AvatarPicker initialAvatarUrl={initialAvatarUrl} onChange={setAvatarSelection} />

      {(localError || state.message) && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            state.errors || localError
              ? "border-red-200 bg-red-50 text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200"
              : "border-green-200 bg-green-50 text-green-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200"
          }`}
        >
          {localError ?? state.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/profile"
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Back to profile
        </Link>
        <button
          type="submit"
          disabled={pending || isUploading}
          className="rounded-full bg-gradient-to-r from-primary to-blue-500 px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
        >
          {pending || isUploading ? "Saving..." : "Save avatar"}
        </button>
      </div>
    </form>
  );
}
