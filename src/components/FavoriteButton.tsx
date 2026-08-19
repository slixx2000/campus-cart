"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FavoriteButtonProps = {
  listingId: string;
  initialFavorited: boolean;
  signedIn: boolean;
  /** When set, renders a full-width labelled button instead of an icon. */
  label?: string;
  className?: string;
};

export default function FavoriteButton({
  listingId,
  initialFavorited,
  signedIn,
  label,
  className = "",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function toggle(event: React.MouseEvent) {
    // Cards wrap this button in a <Link>; without this the click navigates.
    event.preventDefault();
    event.stopPropagation();

    if (!signedIn) {
      router.push(`/auth/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (pending) return;

    const next = !favorited;
    setFavorited(next);
    setPending(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFavorited(!next);
      setPending(false);
      router.push(`/auth/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const { error } = next
      ? await supabase
          .from("favorites")
          .insert({ user_id: user.id, listing_id: listingId })
      : await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

    if (error) setFavorited(!next);
    setPending(false);
  }

  const icon = (
    <span
      className="material-symbols-outlined text-[20px] leading-none"
      style={favorited ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      favorite
    </span>
  );

  if (label) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={favorited}
        className={`btn-secondary w-full ${favorited ? "text-accent" : ""} ${className}`}
      >
        {icon}
        {favorited ? "Saved" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from saved" : "Save listing"}
      className={`rounded-full bg-surface/90 p-1.5 transition-colors ${
        favorited ? "text-accent" : "text-muted hover:text-fg"
      } ${className}`}
    >
      {icon}
    </button>
  );
}
