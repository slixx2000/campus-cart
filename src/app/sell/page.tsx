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
  const [errors, setErrors] = useState<
    Partial<Record<keyof ListingFormData, string>>
  >({});

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
    if (!form.university)
      newErrors.university = "Please select your university.";
    if (!form.sellerName.trim())
      newErrors.sellerName = "Your name is required.";
    if (!form.sellerPhone.trim())
      newErrors.sellerPhone = "Phone number is required.";
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
    if (errors[name as keyof ListingFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-4xl">
              check_circle
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Listing Submitted!
          </h1>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Your listing has been received. Students at{" "}
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
              className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Post Another Listing
            </button>
            <button
              onClick={() => router.push("/browse")}
              className="bg-slate-100 text-slate-800 font-semibold px-8 py-3 rounded-full hover:bg-slate-200 transition-colors"
            >
              Browse Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Progress stepper */}
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
            <div className="h-full bg-gradient-to-r from-primary to-blue-400 w-full rounded-full transition-all duration-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
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
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
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
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    construction
                  </span>
                  Service
                </button>
              </div>
            </div>

            {/* Main details form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Listing Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder={
                    isService
                      ? "e.g. Maths Tutoring – 1st Year Level"
                      : "e.g. Samsung Galaxy A14 – Like New"
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm ${
                    errors.title ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              {/* Category + Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                {!isService && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Condition
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {CONDITIONS.map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, condition: cond }))
                          }
                          className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                            form.condition === cond
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-600 border-slate-200 hover:border-primary"
                          }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price + Location */}
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
                      value={form.price || ""}
                      onChange={handleChange}
                      min={1}
                      max={1000000}
                      placeholder="0.00"
                      className={`w-full pr-4 py-3 pl-16 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm ${
                        errors.price ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    University <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="university"
                    value={form.university}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer text-sm ${
                      errors.university ? "border-red-400" : "border-slate-200"
                    }`}
                  >
                    <option value="">Select university…</option>
                    {UNIVERSITIES.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.shortName} – {u.name}
                      </option>
                    ))}
                  </select>
                  {errors.university && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.university}
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
                  value={form.description}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={4}
                  placeholder="Tell buyers more about your item..."
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none text-sm ${
                    errors.description ? "border-red-400" : "border-slate-200"
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-slate-400">
                    {form.description.length}/1000
                  </p>
                </div>
              </div>

              {/* Seller contact */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">
                  Your Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="sellerName"
                      value={form.sellerName}
                      onChange={handleChange}
                      placeholder="e.g. Mwila Banda"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm ${
                        errors.sellerName
                          ? "border-red-400"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.sellerName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.sellerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Phone (WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="sellerPhone"
                      value={form.sellerPhone}
                      onChange={handleChange}
                      placeholder="+260 97 1234567"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm ${
                        errors.sellerPhone
                          ? "border-red-400"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.sellerPhone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.sellerPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-3 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    arrow_back
                  </span>
                  Back
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 rounded-full font-bold text-white bg-gradient-to-r from-primary to-blue-400 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                >
                  Post Listing
                  <span className="material-symbols-outlined text-lg leading-none">
                    arrow_forward
                  </span>
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
                  <span className="material-symbols-outlined text-primary text-lg leading-none shrink-0">
                    check_circle
                  </span>
                  Items with 3+ photos sell 50% faster.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-lg leading-none shrink-0">
                    check_circle
                  </span>
                  Be specific about the condition of the item.
                </li>
                <li className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-lg leading-none shrink-0">
                    check_circle
                  </span>
                  Mention your preferred meeting spots on campus.
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  security
                </span>
                Safety First
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Always meet in well-lit, public campus areas. Use the
                CampusCart messaging system for all communication.
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
