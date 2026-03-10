"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, UNIVERSITIES } from "@/lib/data";
import { Condition, ListingFormData } from "@/types";

const CONDITIONS: Condition[] = ["New", "Like New", "Good", "Fair"];

export default function SellPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isService, setIsService] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormData, string>>>({});

  const [form, setForm] = useState<ListingFormData>({
    title: "",
    description: "",
    price: 0,
    category: "Other",
    condition: undefined,
    university: "",
    sellerName: "",
    sellerPhone: "",
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ListingFormData, string>> = {};

    if (!form.title.trim()) newErrors.title = "Title is required.";
    if (form.title.trim().length > 100)
      newErrors.title = "Title must be 100 characters or fewer.";
    if (!form.description.trim())
      newErrors.description = "Description is required.";
    if (form.description.trim().length > 1000)
      newErrors.description = "Description must be 1000 characters or fewer.";
    if (!form.price || form.price <= 0)
      newErrors.price = "Please enter a valid price.";
    if (form.price > 1000000)
      newErrors.price = "Price seems too high. Please verify.";
    if (!form.university) newErrors.university = "Please select your university.";
    if (!form.sellerName.trim()) newErrors.sellerName = "Your name is required.";
    if (!form.sellerPhone.trim()) newErrors.sellerPhone = "Phone number is required.";
    if (!/^[+\d\s()-]{7,20}$/.test(form.sellerPhone.trim()))
      newErrors.sellerPhone = "Please enter a valid phone number.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
    // Clear error on change
    if (errors[name as keyof ListingFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // In a real app, this would POST to an API endpoint
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Listing Submitted!
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Your listing has been received. In a production environment it would
          appear on the marketplace after review. Students at{" "}
          <strong>{form.university}</strong> will be able to contact you at{" "}
          <strong>{form.sellerPhone}</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({
                title: "",
                description: "",
                price: 0,
                category: "Other",
                condition: undefined,
                university: "",
                sellerName: "",
                sellerPhone: "",
              });
            }}
            className="bg-green-700 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-green-800 transition"
          >
            Post Another Listing
          </button>
          <button
            onClick={() => router.push("/browse")}
            className="bg-gray-100 text-gray-800 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-200 transition"
          >
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Post a Listing
        </h1>
        <p className="text-sm text-gray-500">
          List your product or service for free and reach students on your campus.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Listing type toggle */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsService(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
              !isService
                ? "border-green-600 bg-green-50 text-green-800"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            📦 Product
          </button>
          <button
            type="button"
            onClick={() => setIsService(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
              isService
                ? "border-teal-600 bg-teal-50 text-teal-800"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            🔧 Service
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={100}
            placeholder={
              isService ? "e.g. Maths Tutoring – 1st Year Level" : "e.g. Samsung Galaxy A14 – Good Condition"
            }
            className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
              errors.title ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={1000}
            rows={4}
            placeholder="Describe your listing in detail…"
            className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${
              errors.description ? "border-red-400" : "border-gray-300"
            }`}
          />
          <div className="flex justify-between">
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-gray-400 text-right">
              {form.description.length}/1000
            </p>
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (K) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
              K
            </span>
            <input
              type="number"
              name="price"
              value={form.price || ""}
              onChange={handleChange}
              min={1}
              max={1000000}
              placeholder="0"
              className={`w-full border rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                errors.price ? "border-red-400" : "border-gray-300"
              }`}
            />
          </div>
          {errors.price && (
            <p className="text-xs text-red-500 mt-1">{errors.price}</p>
          )}
          {isService && (
            <p className="text-xs text-gray-400 mt-1">
              Price per session or agreed rate.
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c.label} value={c.label}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Condition (products only) */}
        {!isService && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <div className="flex gap-2 flex-wrap">
              {CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, condition: cond }))}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${
                    form.condition === cond
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* University */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            University <span className="text-red-500">*</span>
          </label>
          <select
            name="university"
            value={form.university}
            onChange={handleChange}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
              errors.university ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Select your university…</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.id} value={u.name}>
                {u.shortName} – {u.name}
              </option>
            ))}
          </select>
          {errors.university && (
            <p className="text-xs text-red-500 mt-1">{errors.university}</p>
          )}
        </div>

        {/* Seller info */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="font-semibold text-gray-700 mb-4 text-sm">
            Your Contact Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sellerName"
                value={form.sellerName}
                onChange={handleChange}
                placeholder="e.g. Mwila Banda"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  errors.sellerName ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.sellerName && (
                <p className="text-xs text-red-500 mt-1">{errors.sellerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (WhatsApp) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="sellerPhone"
                value={form.sellerPhone}
                onChange={handleChange}
                placeholder="+260 97 1234567"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  errors.sellerPhone ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.sellerPhone && (
                <p className="text-xs text-red-500 mt-1">{errors.sellerPhone}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Buyers will contact you via call or WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-800">
          ⚠️ By submitting, you agree that your listing complies with our
          community guidelines. Do not post illegal, counterfeit, or harmful items.
        </div>

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl text-base transition"
        >
          Post Listing for Free
        </button>
      </form>
    </div>
  );
}
