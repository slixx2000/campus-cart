"use client";

import { useActionState, useState } from "react";
import { createListingAction } from "./actions";
import { useUniversities } from "@/hooks/useUniversities";
import type { CategoryRow } from "@/types/database";

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

interface SellFormProps {
  categories: CategoryRow[];
}

export default function SellForm({ categories }: SellFormProps) {
  const [state, formAction, pending] = useActionState(createListingAction, {});
  const [isService, setIsService] = useState(false);
  const [condition, setCondition] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const { universities, isLoading, error } = useUniversities();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setSelectedImages(files);
  };

  return (
    <div className="bg-background-light min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-wider">
                Post a Listing
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Item Details
              </h1>
            </div>
          </div>
          <div
            className="h-3 w-full bg-slate-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Listing form progress"
          >
            <div className="h-full bg-gradient-to-r from-primary to-blue-400 w-full rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product/Service toggle */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Listing Type</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsService(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors flex items-center justify-center gap-2 ${
                    !isService
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    inventory_2
                  </span>
                  Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsService(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors flex items-center justify-center gap-2 ${
                    isService
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    construction
                  </span>
                  Service
                </button>
              </div>
            </div>

            <form action={formAction} className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Hidden inputs */}
              <input type="hidden" name="isService" value={String(isService)} />
              <input type="hidden" name="condition" value={condition} />

              {state.message && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {state.message}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Listing Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  maxLength={100}
                  placeholder={
                    isService
                      ? "e.g. Maths Tutoring – 1st Year Level"
                      : "e.g. Samsung Galaxy A14 – Like New"
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm ${
                    state.errors?.title ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {state.errors?.title && (
                  <p className="text-xs text-red-500 mt-1">{state.errors.title[0]}</p>
                )}
              </div>

              {/* Category + Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer text-sm"
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {state.errors?.categoryId && (
                    <p className="text-xs text-red-500 mt-1">{state.errors.categoryId[0]}</p>
                  )}
                </div>

                {!isService && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Condition
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {CONDITIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() =>
                            setCondition((prev) =>
                              prev === c.value ? "" : c.value
                            )
                          }
                          className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                            condition === c.value
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-600 border-slate-200 hover:border-primary"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price + University */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Price (ZMW) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ZMW
                    </span>
                    <input
                      type="number"
                      name="price"
                      required
                      min={1}
                      max={999999}
                      placeholder="0.00"
                      className={`w-full pr-4 py-3 pl-16 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary outline-none text-sm ${
                        state.errors?.price ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                  </div>
                  {state.errors?.price && (
                    <p className="text-xs text-red-500 mt-1">{state.errors.price[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    University <span className="text-red-500">*</span>
                  </label>
                  {error && (
                    <p className="text-xs text-amber-700 mb-2">
                      {error}
                    </p>
                  )}
                  <select
                    name="universityId"
                    required
                    disabled={isLoading || universities.length === 0}
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer text-sm ${
                      state.errors?.universityId ? "border-red-400" : "border-slate-200"
                    }`}
                  >
                    <option value="">
                      {isLoading
                        ? "Loading universities..."
                        : universities.length === 0
                        ? "No universities available"
                        : "Select university…"}
                    </option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.short_name} – {u.name}
                      </option>
                    ))}
                  </select>
                  {state.errors?.universityId && (
                    <p className="text-xs text-red-500 mt-1">{state.errors.universityId[0]}</p>
                  )}
                  {!isLoading && !error && universities.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Add universities in Supabase before posting listings.
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder="Tell buyers more about your item..."
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary outline-none resize-none text-sm ${
                    state.errors?.description ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {state.errors?.description && (
                  <p className="text-xs text-red-500 mt-1">{state.errors.description[0]}</p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Photos (up to 5)
                </label>
                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {selectedImages.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedImages.length} file{selectedImages.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end pt-4">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-10 py-3 rounded-full font-bold text-white bg-gradient-to-r from-primary to-blue-400 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {pending ? (
                    <span className="material-symbols-outlined animate-spin text-lg leading-none">
                      progress_activity
                    </span>
                  ) : (
                    <>
                      Post Listing
                      <span className="material-symbols-outlined text-lg leading-none">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar tips */}
          <div className="space-y-6">
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
              <h4 className="font-bold text-primary flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined">lightbulb</span>
                Selling Tips
              </h4>
              <ul className="text-sm text-slate-600 space-y-3">
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-lg leading-none shrink-0">check_circle</span>
                  Items with 3+ photos sell 50% faster.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-lg leading-none shrink-0">check_circle</span>
                  Be specific about the condition of the item.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-lg leading-none shrink-0">check_circle</span>
                  Mention your preferred meeting spots on campus.
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                Safety First
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Always meet in well-lit, public campus areas.
              </p>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                ⚠️ Do not post illegal, counterfeit, or harmful items.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
