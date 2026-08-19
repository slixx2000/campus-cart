"use client";
import Link from "next/link";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createListingAction } from "./actions";
import { useUniversities } from "@/hooks/useUniversities";
import { formatPrice } from "@/lib/data";
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
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement | null>(null);

  // A step is a slice of one form; every field stays mounted so FormData still
  // carries the whole payload on submit.
  const STEPS = ["Photos", "Details", "Price", "Location"] as const;
  const FIELD_STEP: Record<string, number> = {
    title: 1,
    categoryId: 1,
    condition: 1,
    description: 1,
    price: 2,
    universityId: 3,
  };

  const coverImageUrl = useMemo(
    () => (selectedImages[0] ? URL.createObjectURL(selectedImages[0]) : null),
    [selectedImages]
  );
  useEffect(() => {
    return () => {
      if (coverImageUrl) URL.revokeObjectURL(coverImageUrl);
    };
  }, [coverImageUrl]);

  // Server-side (zod) errors can belong to a step that isn't showing.
  useEffect(() => {
    const firstErrorField = Object.keys(state.errors ?? {})[0];
    if (firstErrorField && FIELD_STEP[firstErrorField] !== undefined) {
      setStep(FIELD_STEP[firstErrorField]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.errors]);

  const goToStep = (next: number) => {
    // Only validate when moving forward, and only the step being left.
    if (next > step) {
      const container = formRef.current?.querySelector<HTMLElement>(
        `[data-step="${step}"]`
      );
      const fields = container?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea");
      for (const field of fields ?? []) {
        if (!field.checkValidity()) {
          field.reportValidity();
          return;
        }
      }
    }
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  };

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
    <div className="min-h-screen bg-bg text-fg transition-colors">
      {/* Focused task bar, per the design: no marketplace chrome mid-flow. */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-12">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Cancel and go home" className="text-muted hover:text-fg">
              <span className="material-symbols-outlined align-middle">close</span>
            </Link>
            <span className="text-lg font-semibold tracking-tight text-fg">
              Create Listing
            </span>
          </div>
          <button
            type="submit"
            form="create-listing"
            disabled={pending || isUploading}
            className="btn-primary px-4 py-2 text-sm"
          >
            {pending || isUploading ? "Publishing…" : "Publish Listing"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
        {/* Step progress */}
        <ol className="mb-10 flex items-center gap-2">
          {STEPS.map((label, index) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => goToStep(index)}
                className="flex items-center gap-2 text-left"
                aria-current={index === step ? "step" : undefined}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    index <= step
                      ? "bg-primary text-on-primary"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    index === step ? "text-fg" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </button>
              {index < STEPS.length - 1 ? (
                <span
                  className={`h-px flex-1 ${index < step ? "bg-primary" : "bg-line"}`}
                />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <form
              id="create-listing"
              ref={formRef}
              onSubmit={handleSubmit}
              onInput={(e) =>
                setPreview(
                  Object.fromEntries(
                    new FormData(e.currentTarget) as unknown as Iterable<[string, string]>
                  )
                )
              }
              noValidate
              className="card space-y-6 p-6"
            >
              {/* Hidden inputs */}
              <input type="hidden" name="isService" value={String(isService)} />
              <input type="hidden" name="condition" value={condition} />

              {state.message && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
                  {state.message}
                </div>
              )}

              <div data-step="0" className={step === 0 ? "space-y-6" : "hidden"}>
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
                  className="w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-primary hover:file:bg-primary/20 dark:text-slate-400 dark:file:bg-accent dark:file:text-accent dark:hover:file:bg-accent"
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
                  <div className="mt-3 rounded-2xl border border-line bg-surface-2 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>{uploadStatus}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-surface">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              </div>

              <div data-step="1" className={step === 1 ? "space-y-6" : "hidden"}>
            {/* Product/Service toggle */}
              <div>
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Listing Type</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsService(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors flex items-center justify-center gap-2 ${
                    !isService
                      ? "border-primary bg-primary/5 text-primary   "
                      : "border-line text-slate-500  dark:text-slate-400"
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
                      : "border-line text-slate-500  dark:text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    construction
                  </span>
                  Service
                </button>
              </div>
            </div>
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
                  className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary  dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300 ${
                    state.errors?.title
                      ? "border-red-400 dark:border-rose-300"
                      : "border-line "
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
                    className="w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:text-white dark:focus:ring-sky-300"
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
                              ? "border-primary bg-primary text-on-primary   dark:text-slate-950"
                              : "border-line bg-surface text-slate-600 hover:border-primary  dark:bg-surface dark:text-slate-300 dark:hover:border-sky-300"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                  className={`w-full resize-none rounded-xl border bg-surface-2 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary  dark:text-white dark:focus:ring-sky-300 ${
                    state.errors?.description
                      ? "border-red-400 dark:border-rose-300"
                      : "border-line "
                  }`}
                />
                {state.errors?.description && (
                  <p className="text-xs text-red-500 mt-1">{state.errors.description[0]}</p>
                )}
              </div>
              </div>

              <div data-step="2" className={step === 2 ? "space-y-6" : "hidden"}>
              {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Price (K) <span className="text-red-500">*</span>
                  </label>
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    Set your price. Check similar listings to stay competitive.
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500">
                      K
                    </span>
                    <input
                      type="number"
                      name="price"
                      required
                      min={1}
                      max={999999}
                      placeholder="0.00"
                      className={`w-full rounded-xl border bg-surface-2 py-3 pl-16 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary  dark:text-white dark:focus:ring-sky-300 ${
                        state.errors?.price
                          ? "border-red-400 dark:border-rose-300"
                          : "border-line "
                      }`}
                    />
                  </div>
                  {state.errors?.price && (
                    <p className="text-xs text-red-500 mt-1">{state.errors.price[0]}</p>
                  )}
                </div>
              </div>

              <div data-step="3" className={step === 3 ? "space-y-6" : "hidden"}>
              {/* Location */}
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
                    className={`w-full cursor-pointer appearance-none rounded-xl border bg-surface-2 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary  dark:text-white dark:focus:ring-sky-300 ${
                      state.errors?.universityId
                        ? "border-red-400 dark:border-rose-300"
                        : "border-line "
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

              {/* Step navigation */}
              <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  disabled={step === 0}
                  className="btn-ghost disabled:invisible"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    arrow_back
                  </span>
                  Back
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(step + 1)}
                    className="btn-primary px-8 py-3"
                  >
                    Continue
                    <span className="material-symbols-outlined text-lg leading-none">
                      arrow_forward
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={pending || isUploading}
                    className="btn-primary px-8 py-3"
                  >
                    {pending || isUploading ? (
                      <span className="material-symbols-outlined animate-spin text-lg leading-none">
                        progress_activity
                      </span>
                    ) : (
                      <>
                        Publish Listing
                        <span className="material-symbols-outlined text-lg leading-none">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Live preview */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h3 className="text-base font-semibold text-fg">Live Preview</h3>
            <p className="mb-4 text-sm text-muted">
              This is how buyers will see your listing.
            </p>

            <div className="card overflow-hidden">
              <div className="relative flex aspect-square items-center justify-center bg-surface-2">
                {coverImageUrl ? (
                  // Local object URL from the file picker; next/image adds nothing here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImageUrl}
                    alt="Listing cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-muted">
                    image
                  </span>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="text-lg font-bold text-fg">
                  {preview.price ? formatPrice(Number(preview.price)) : "K0"}
                </p>
                <p className="line-clamp-1 text-sm text-fg">
                  {preview.title || "Listing title"}
                </p>
                <p className="flex items-center gap-1 pt-1 text-xs text-muted">
                  <span className="material-symbols-outlined text-[14px] leading-none">
                    location_on
                  </span>
                  {universities.find((u) => u.id === preview.universityId)?.short_name ??
                    "Location"}
                </p>
                {categories.find((c) => c.id === preview.categoryId) ? (
                  <span className="chip mt-2">
                    {categories.find((c) => c.id === preview.categoryId)?.name}
                  </span>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
