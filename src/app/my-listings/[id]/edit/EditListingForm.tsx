"use client";

import { useActionState, useState } from "react";
import { updateListingAction } from "@/app/my-listings/actions";
import type { CategoryRow, ListingWithRelations } from "@/types/database";

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

interface EditListingFormProps {
  listing: ListingWithRelations;
  categories: CategoryRow[];
}

export default function EditListingForm({
  listing,
  categories,
}: EditListingFormProps) {
  const [state, formAction, pending] = useActionState(updateListingAction, {});
  const [condition, setCondition] = useState(listing.condition ?? "");

  return (
    <div className="min-h-screen bg-background-light text-slate-900 transition-colors dark:bg-[#07111f] dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5 dark:shadow-[0_35px_120px_-55px_rgba(8,15,33,0.95)]">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80 dark:text-sky-300">
            Manage listing
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            Edit Listing
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Update the details buyers see before you republish changes.
          </p>
        </div>

        {state.message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-6 rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="hidden" name="condition" value={condition} />

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              defaultValue={listing.title}
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300"
            />
            {state.errors?.title && (
              <p className="text-xs text-red-500 mt-1">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Category</label>
              <select
                name="categoryId"
                defaultValue={listing.category_id}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Price (ZMW)
              </label>
              <input
                type="number"
                name="price"
                defaultValue={Number(listing.price)}
                min={1}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300"
              />
            </div>
          </div>

          {!listing.is_service && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Condition</label>
              <div className="flex gap-2 flex-wrap">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition((prev) => prev === c.value ? "" : c.value)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                      condition === c.value
                        ? "border-primary bg-primary text-white dark:border-sky-300 dark:bg-sky-300 dark:text-slate-950"
                        : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">Description</label>
            <textarea
              name="description"
              defaultValue={listing.description}
              maxLength={2000}
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300"
            />
          </div>

          <div className="flex justify-end gap-4">
            <a
              href="/my-listings"
              className="rounded-full border border-slate-200 px-8 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-400 px-10 py-3 font-bold text-white transition-all hover:shadow-lg disabled:opacity-60 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
            >
              {pending ? (
                <span className="material-symbols-outlined animate-spin text-lg leading-none">
                  progress_activity
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
