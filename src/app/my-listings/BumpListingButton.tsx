"use client";

import { useActionState } from "react";
import { bumpListingAction, type BumpListingState } from "./actions";

export default function BumpListingButton({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState<BumpListingState, FormData>(
    bumpListingAction,
    {}
  );

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        disabled={pending}
        title={state.message ?? "Move this listing back to the top of the feed"}
        className="btn-secondary px-4 py-2 text-xs disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-sm leading-none">
          arrow_upward
        </span>
        {pending ? "Bumping…" : "Bump"}
      </button>
      {state.message ? (
        <p
          className={`text-xs ${state.ok ? "text-accent" : "text-danger"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
