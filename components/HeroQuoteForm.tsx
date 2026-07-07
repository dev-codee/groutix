"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ShieldCheck, Paperclip, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AREA_OPTIONS = [
  "Main Bathroom",
  "Guest Bathroom",
  "Ensuite Bathroom",
  "Toilet",
  "Kitchen",
  "Laundry",
  "Balcony",
  "Other",
];

const HEARD_OPTIONS = [
  "TV",
  "Radio",
  "Vehicle",
  "Flyer",
  "Friend or Family",
  "Real Estate Agent",
  "Other",
];

const STATE_OPTIONS = ["Select State", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];

const ENQUIRY_OPTIONS = [
  "Shower cubicle only",
  "Entire shower regrout",
  "Shower base repair",
  "Waterproofing / leaking shower",
  "Tile repair / grout refresh",
];

const field =
  "w-full rounded-sm border border-neutral-200 bg-white px-3 py-2 text-[15px] text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
        active
          ? "border-primary bg-primary text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function HeroQuoteForm() {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    enquiry: "Shower cubicle only",
    message: "",
    heard: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [areas, setAreas] = useState<string[]>([]);
  const [areaError, setAreaError] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string) => {
    let error = "";
    if (!value) {
      error = "This field is required";
    } else {
      switch (name) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = "Please enter a valid email address";
          }
          break;
        case "phone":
          const phoneRegex = /^[0-9+\-\s()]{8,}$/;
          if (!phoneRegex.test(value)) {
            error = "Please enter a valid phone number";
          }
          break;
        default:
          break;
      }
    }
    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData((p) => ({ ...p, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const toggleArea = (v: string) => {
    setAreas((list) => {
      const newList = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
      if (areaError && newList.length > 0) setAreaError(false);
      return newList;
    });
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos((prev) => [...prev, ...Array.from(e.target.files!)]);
  };
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(data).forEach((key) => {
      const error = validateField(key, data[key as keyof typeof data]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    setTouched(Object.keys(data).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    if (areas.length === 0) {
      setAreaError(true);
    }

    if (Object.keys(newErrors).length === 0 && areas.length > 0) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
      }, 1100);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-md border border-white/40 bg-gradient-to-r from-white/85 via-white/75 to-white/55 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {/* glass sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-3 px-6 py-14 text-center sm:px-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
              >
                <CheckCircle2 className="h-9 w-9" />
              </motion.div>
              <h3 className="text-2xl font-black tracking-tight text-neutral-900">
                Request Received!
              </h3>
              <p className="max-w-sm text-base leading-relaxed text-neutral-600">
                Thanks{data.firstName ? `, ${data.firstName}` : ""}. One of our local GROUTIX
                specialists will call you back shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setPhotos([]);
                }}
                className="mt-3 rounded-sm bg-primary hover:bg-primary-hover px-6 py-2.5 text-[16px] font-bold text-white transition-all duration-200 active:scale-95"
              >
                Request Another Quote
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onSubmit={handleSubmit}
              className="space-y-2.5 px-5 py-5 sm:px-6"
            >
              <h3 className="text-center text-xl font-black tracking-tight text-neutral-900">
                Request A Quote
              </h3>

              {/* Name */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <input
                    name="firstName"
                    value={data.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="First Name"
                    className={`${field} ${touched.firstName && errors.firstName ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-[13px] font-semibold text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    name="lastName"
                    value={data.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Last Name"
                    className={`${field} ${touched.lastName && errors.lastName ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-[13px] font-semibold text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email / Phone */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <input
                    type="email"
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Email"
                    className={`${field} ${touched.email && errors.email ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-[13px] font-semibold text-red-600">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="tel"
                    name="phone"
                    value={data.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Phone"
                    className={`${field} ${touched.phone && errors.phone ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-[13px] font-semibold text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <input
                  name="address"
                  value={data.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Address"
                  className={`${field} ${touched.address && errors.address ? "border-red-500 focus:ring-red-500/20" : ""}`}
                />
                {touched.address && errors.address && (
                  <p className="text-[13px] font-semibold text-red-600">{errors.address}</p>
                )}
              </div>

              {/* City / State */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <input
                    name="city"
                    value={data.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="City"
                    className={`${field} ${touched.city && errors.city ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                  {touched.city && errors.city && (
                    <p className="text-[13px] font-semibold text-red-600">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-1 relative">
                  <select
                    name="state"
                    value={data.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${field} appearance-none pr-9 ${data.state ? "" : "text-neutral-400"} ${touched.state && errors.state ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  >
                    {STATE_OPTIONS.map((s) => (
                      <option key={s} value={s === "Select State" ? "" : s} disabled={s === "Select State"}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  {touched.state && errors.state && (
                    <p className="text-[13px] font-semibold text-red-600">{errors.state}</p>
                  )}
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-neutral-900">
                  What area/s are you looking to have serviced? *
                </p>
                <div className="flex flex-wrap gap-2">
                  {AREA_OPTIONS.map((a) => (
                    <Chip key={a} label={a} active={areas.includes(a)} onClick={() => toggleArea(a)} />
                  ))}
                </div>
                <AnimatePresence>
                  {areaError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[13px] font-semibold text-red-600 overflow-hidden"
                    >
                      Please select at least one area.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Enquiry */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="flex-none text-[15px] font-bold text-neutral-900">
                  Is your enquiry about:
                </p>
                <div className="relative flex-1">
                  <select name="enquiry" value={data.enquiry} onChange={handleChange} required className={`${field} appearance-none pr-9`}>
                    {ENQUIRY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <textarea
                  name="message"
                  rows={2}
                  value={data.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Tell us more about how we can help."
                  className={`${field} resize-none ${touched.message && errors.message ? "border-red-500 focus:ring-red-500/20" : ""}`}
                />
                {touched.message && errors.message && (
                  <p className="text-[13px] font-semibold text-red-600">{errors.message}</p>
                )}
              </div>

              {/* Attach photos */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-neutral-900">Attach photos</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowInfo((s) => !s)}
                      aria-label="How to take photos"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition-all duration-200 hover:border-secondary hover:text-secondary"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    <AnimatePresence>
                      {showInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 top-7 z-20 w-64 rounded-md border border-neutral-200 bg-white p-3 text-[13px] leading-relaxed text-neutral-600 shadow-lg"
                        >
                          <button
                            type="button"
                            onClick={() => setShowInfo(false)}
                            className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-700 transition-colors"
                            aria-label="Close"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <p className="pr-4 font-semibold text-neutral-900">How to take good photos</p>
                          <p className="mt-1">
                            Take clear, well-lit photos of the affected area — a wide shot of the whole
                            shower/balcony plus a close-up of any cracks, mould or damaged grout.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-neutral-300 bg-white/60 px-4 py-3 text-[15px] font-medium text-neutral-600 transition-all duration-200 hover:border-secondary hover:text-secondary">
                  <Paperclip className="h-4 w-4" />
                  <span>Click to upload photos (optional)</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                </label>

                <AnimatePresence>
                  {photos.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {photos.map((f, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between gap-2 rounded-sm bg-white/70 px-3 py-1.5 text-[13px] text-neutral-700"
                        >
                          <span className="truncate">{f.name}</span>
                          <button type="button" onClick={() => removePhoto(i)} className="text-neutral-400 hover:text-red-600 transition-colors" aria-label="Remove photo">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* Heard about — dropdown */}
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-neutral-900">Where have you heard about us? *</p>
                <div className="relative space-y-1">
                  <select
                    name="heard"
                    value={data.heard}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${field} appearance-none pr-9 ${data.heard ? "" : "text-neutral-400"} ${touched.heard && errors.heard ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  >
                    <option value="" disabled>Please select</option>
                    {HEARD_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  {touched.heard && errors.heard && (
                    <p className="text-[13px] font-semibold text-red-600">{errors.heard}</p>
                  )}
                </div>
              </div>

              {/* Captcha placeholder */}
              <div className="flex w-full max-w-[320px] items-center justify-between rounded-sm bg-neutral-900 px-4 py-2">
                <span className="flex items-center gap-2 text-base font-semibold text-white">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-white" />
                  </span>
                  Success!
                </span>
                <span className="text-right text-[11px] leading-tight text-neutral-400">
                  Captcha
                  <br />
                  placeholder
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm bg-primary hover:bg-primary-hover py-3 text-[16px] font-bold text-white shadow-lg transition-all duration-200 active:scale-95 disabled:bg-neutral-300"
              >
                {loading ? "Sending..." : "Submit Request"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
