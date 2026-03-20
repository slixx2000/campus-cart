"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { createListingAction } from "./actions";
import { useUniversities } from "@/hooks/useUniversities";
import type { CategoryRow } from "@/types/database";
import {
  MAX_LISTING_IMAGE_COUNT,
  MAX_LISTING_IMAGE_SIZE_BYTES,
  type UploadedListingImage,
  uploadListingImage,
} from "@/lib/imageUpload";

const RAW_IMAGE_LIMIT_LABEL = "15 MB";

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

interface SellFormProps {
  categories: CategoryRow[];
  userId: string;
}

export default function SellForm({ categories, userId }: SellFormProps) {
  const [state, formAction, pending] = useActionState(createListingAction, {});
  const [isService, setIsService] = useState(false);
  const [condition, setCondition] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { universities, isLoading, error } = useUniversities();

  useEffect(() => {
    if (!pending) {
      setIsUploading(false);
    }
  }, [pending, state]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_LISTING_IMAGE_COUNT);

    if (files.some((file) => file.size > MAX_LISTING_IMAGE_SIZE_BYTES)) {
      setSelectedImages([]);
      setImageError(`One or more files exceed the ${RAW_IMAGE_LIMIT_LABEL} limit.`);
      e.currentTarget.value = "";
      return;
    }

    setImageError(null);
    setUploadStatus(null);
    setUploadProgress(0);
    setSelectedImages(files);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (imageError) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.delete("images");
    formData.set("listingId", crypto.randomUUID());

    try {
      setIsUploading(true);
      setUploadStatus(selectedImages.length > 0 ? "Preparing images..." : "Submitting listing...");
      setUploadProgress(selectedImages.length > 0 ? 5 : 100);

      const uploadedImages: UploadedListingImage[] = [];

      for (let index = 0; index < selectedImages.length; index += 1) {
        const file = selectedImages[index];
        const listingId = String(formData.get("listingId"));

        const uploadedImage = await uploadListingImage(file, {
          userId,
          listingId,
          onProgress: (fileProgress, stage) => {
            const overallProgress = Math.round(
              ((index + fileProgress / 100) / selectedImages.length) * 100
            );
            setUploadProgress(overallProgress);
            setUploadStatus(`${stage} (${index + 1}/${selectedImages.length})`);
          },
        });

        uploadedImages.push(uploadedImage);
      }

      formData.set("uploadedImages", JSON.stringify(uploadedImages));
      setUploadStatus("Saving listing...");
      setUploadProgress(100);

      startTransition(() => {
        formAction(formData);
      });
    } catch (submitError) {
      setImageError(
        submitError instanceof Error
          ? submitError.message
          : "We could not process your images. Please try again."
      );
      setUploadStatus(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light text-slate-900 transition-colors dark:bg-[#07111f] dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.28em] text-primary dark:text-sky-300">
                Post a Listing
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Item Details
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Build a clean listing with strong visuals, accurate campus details,
                and enough context for a buyer to act quickly.
              </p>
            </div>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
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
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Listing Type</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsService(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors flex items-center justify-center gap-2 ${
                    !isService
                      ? "border-primary bg-primary/5 text-primary dark:border-sky-300 dark:bg-sky-300/10 dark:text-sky-300"
                      : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400"
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
                      ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-cyan-300 dark:bg-cyan-300/10 dark:text-cyan-200"
                      : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    construction
                  </span>
                  Service
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
              {/* Hidden inputs */}
              <input type="hidden" name="isService" value={String(isService)} />
              <input type="hidden" name="condition" value={condition} />

              {state.message && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
                  {state.message}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Listing Title <span className="text-red-500">*</span>
                </label>
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                  {isService ? "What service are you offering?" : "What are you selling? Include brand/model if possible."}
                </p>
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
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300 ${
                    state.errors?.title
                      ? "border-red-400 dark:border-rose-300"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                />
                {state.errors?.title && (
                  <p className="text-xs text-red-500 mt-1">{state.errors.title[0]}</p>
                )}
              </div>

              {/* Category + Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    required
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300"
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
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
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
                              ? "border-primary bg-primary text-white dark:border-sky-300 dark:bg-sky-300 dark:text-slate-950"
                              : "border-slate-200 bg-white text-slate-600 hover:border-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-sky-300"
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
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Price (ZMW) <span className="text-red-500">*</span>
                  </label>
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    Set your price. Check similar listings to stay competitive.
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500">
                      ZMW
                    </span>
                    <input
                      type="number"
                      name="price"
                      required
                      min={1}
                      max={999999}
                      placeholder="0.00"
                      className={`w-full rounded-xl border bg-slate-50 py-3 pl-16 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300 ${
                        state.errors?.price
                          ? "border-red-400 dark:border-rose-300"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                    />
                  </div>
                  {state.errors?.price && (
                    <p className="text-xs text-red-500 mt-1">{state.errors.price[0]}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    University <span className="text-red-500">*</span>
                  </label>
                  {error && (
                    <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
                      {error}
                    </p>
                  )}
                  <select
                    name="universityId"
                    required
                    disabled={isLoading || universities.length === 0}
                    className={`w-full cursor-pointer appearance-none rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300 ${
                      state.errors?.universityId
                        ? "border-red-400 dark:border-rose-300"
                        : "border-slate-200 dark:border-white/10"
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
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Add universities in Supabase before posting listings.
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Description <span className="text-red-500">*</span>
                </label>
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                  {isService ? "What's included? How long does it typically take?" : "Describe condition, any defects, why you're selling, and how to contact you."}
                </p>
                <textarea
                  name="description"
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder="Tell buyers more about your item..."
                  className={`w-full resize-none rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:bg-[#0d1a2b] dark:text-white dark:focus:ring-sky-300 ${
                    state.errors?.description
                      ? "border-red-400 dark:border-rose-300"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                />
                {state.errors?.description && (
                  <p className="text-xs text-red-500 mt-1">{state.errors.description[0]}</p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Photos (up to 6)
                </label>
                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-primary hover:file:bg-primary/20 dark:text-slate-400 dark:file:bg-sky-300/10 dark:file:text-sky-300 dark:hover:file:bg-sky-300/20"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Images are compressed to JPEG before upload for faster posting.
                </p>
                {imageError && (
                  <p className="mt-1 text-xs text-red-500 dark:text-rose-300">{imageError}</p>
                )}
                {selectedImages.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {selectedImages.length} file{selectedImages.length > 1 ? "s" : ""} selected
                  </p>
                )}
                {uploadStatus && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#0d1a2b]">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>{uploadStatus}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-[width] duration-300 dark:from-sky-400 dark:to-cyan-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end pt-4">
                <button
                  type="submit"
                  disabled={pending || isUploading}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-400 px-10 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950 dark:hover:shadow-sky-400/20"
                >
                  {pending || isUploading ? (
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
            <div className="rounded-[1.75rem] border border-primary/20 bg-primary/10 p-6 dark:border-sky-400/20 dark:bg-sky-400/10">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-primary dark:text-sky-200">
                <span className="material-symbols-outlined">lightbulb</span>
                Selling Tips
              </h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="material-symbols-outlined shrink-0 text-lg leading-none text-primary dark:text-sky-300">check_circle</span>
                  Items with 3+ photos sell 50% faster.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined shrink-0 text-lg leading-none text-primary dark:text-sky-300">check_circle</span>
                  Be specific about the condition of the item.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined shrink-0 text-lg leading-none text-primary dark:text-sky-300">check_circle</span>
                  Mention your preferred meeting spots on campus.
                </li>
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
              <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-primary dark:text-sky-300">security</span>
                Safety First
              </h4>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Always meet in well-lit, public campus areas.
              </p>
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                ⚠️ Do not post illegal, counterfeit, or harmful items.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
