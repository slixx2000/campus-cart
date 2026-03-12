"use client";

import { useEffect, useMemo, useState } from "react";
import AvatarImage from "@/components/AvatarImage";
import { fetchDefaultAvatars } from "@/lib/avatarService";

export type AvatarSelection =
  | { type: "default"; url: string }
  | { type: "upload"; file: File; previewUrl: string }
  | { type: "none" };

interface AvatarPickerProps {
  initialAvatarUrl?: string | null;
  onChange: (selection: AvatarSelection) => void;
}

export default function AvatarPicker({ initialAvatarUrl, onChange }: AvatarPickerProps) {
  const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);
  const [selection, setSelection] = useState<AvatarSelection>(() =>
    initialAvatarUrl ? { type: "default", url: initialAvatarUrl } : { type: "none" }
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    fetchDefaultAvatars()
      .then((avatars) => {
        if (!isActive) return;
        setDefaultAvatars(avatars);

        if (selection.type === "none" && avatars[0]) {
          const nextSelection = { type: "default", url: avatars[0] } as const;
          setSelection(nextSelection);
          onChange(nextSelection);
        }
      })
      .catch((avatarError) => {
        if (!isActive) return;
        setError(avatarError instanceof Error ? avatarError.message : "Failed to load avatars.");
      });

    return () => {
      isActive = false;
    };
  }, [onChange, selection.type]);

  useEffect(() => {
    onChange(selection);
  }, [onChange, selection]);

  const selectedPreview = useMemo(() => {
    if (selection.type === "upload") return selection.previewUrl;
    if (selection.type === "default") return selection.url;
    return initialAvatarUrl ?? null;
  }, [initialAvatarUrl, selection]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelection({ type: "upload", file, previewUrl });
    setError(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="size-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/10">
          <AvatarImage alt="Selected avatar" src={selectedPreview} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Profile picture</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload your own avatar or choose one of the default profile icons.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
          Upload a custom image
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-primary hover:file:bg-primary/20 dark:text-slate-400 dark:file:bg-sky-300/10 dark:file:text-sky-300 dark:hover:file:bg-sky-300/20"
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Choose a default avatar</p>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-5">
          {defaultAvatars.map((avatarUrl, index) => {
            const isSelected = selection.type === "default" && selection.url === avatarUrl;
            return (
              <button
                key={avatarUrl}
                type="button"
                onClick={() => setSelection({ type: "default", url: avatarUrl })}
                className={`overflow-hidden rounded-2xl border p-1 transition ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 dark:border-sky-300 dark:ring-sky-300/20"
                    : "border-slate-200 hover:border-primary/40 dark:border-white/10 dark:hover:border-sky-300/40"
                }`}
                aria-label={`Select avatar ${index + 1}`}
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10">
                  <AvatarImage alt={`Default avatar ${index + 1}`} src={avatarUrl} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-rose-300">{error}</p>
      )}
    </div>
  );
}
