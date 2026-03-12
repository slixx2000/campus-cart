"use client";

import { deleteListingAction } from "./actions";

interface ArchiveListingButtonProps {
  listingId: string;
}

export default function ArchiveListingButton({ listingId }: ArchiveListingButtonProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("Archive this listing? It will no longer be visible.")) {
      event.preventDefault();
    }
  };

  return (
    <form action={deleteListingAction} onSubmit={handleSubmit}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        className="w-full rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:border-rose-300/20 dark:text-rose-300 dark:hover:bg-rose-300/10"
      >
        Archive
      </button>
    </form>
  );
}
