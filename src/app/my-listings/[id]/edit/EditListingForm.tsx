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
    <div className="bg-background-light min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Edit Listing</h1>

        {state.message && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">
            {state.message}
          </div>
        )}

        <form action={formAction} className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="hidden" name="condition" value={condition} />

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              defaultValue={listing.title}
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-sm"
            />
            {state.errors?.title && (
              <p className="text-xs text-red-500 mt-1">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <select
                name="categoryId"
                defaultValue={listing.category_id}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Price (ZMW)
              </label>
              <input
                type="number"
                name="price"
                defaultValue={Number(listing.price)}
                min={1}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
          </div>

          {!listing.is_service && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Condition</label>
              <div className="flex gap-2 flex-wrap">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition((prev) => prev === c.value ? "" : c.value)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                      condition === c.value
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={listing.description}
              maxLength={2000}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-4">
            <a
              href="/my-listings"
              className="px-8 py-3 rounded-full font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={pending}
              className="px-10 py-3 rounded-full font-bold text-white bg-gradient-to-r from-primary to-blue-400 hover:shadow-lg transition-all disabled:opacity-60 flex items-center gap-2"
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
