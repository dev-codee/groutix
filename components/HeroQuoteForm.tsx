import React, { useRef, useState } from "react";
import { CheckCircle2, Paperclip, Info, X, AlertCircle, Plus, Trash2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { formatBytes, MAX_TOTAL_BYTES, MAX_FILE_SIZE_BYTES, MAX_PHOTO_COUNT } from "@/lib/imageCompression";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;



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

const SERVICE_OPTIONS = [
  "Shower Cubicle Regrouting",
  "Leaking Shower Repair",
  "Shower Base Repair",
  "Silicone Replacement",
  "Balcony Regrouting",
  "Balcony Leak Repair",
  "Other",
];

const DAMAGED_TILE_OPTIONS = [
  "No",
  "Cracked tiles",
  "Loose / drummy tiles",
  "Lifting tiles",
  "Not sure",
];

const LEAKING_OPTIONS = ["Yes", "No", "Not sure"];

const fieldStyle =
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
      className={`rounded-sm border px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${active
        ? "border-primary bg-primary text-white shadow-sm"
        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
        }`}
    >
      {label}
    </button>
  );
}

type TenantInfo = {
  name: string;
  phone: string;
  email: string;
};

export default function HeroQuoteForm() {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    agency: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [areas, setAreas] = useState<string[]>([]);
  const [areaError, setAreaError] = useState(false);

  const [services, setServices] = useState<string[]>([]);
  const [serviceError, setServiceError] = useState(false);

  const [damagedTiles, setDamagedTiles] = useState<string[]>([]);
  const [damagedTileError, setDamagedTileError] = useState(false);

  const [isPropertyManager, setIsPropertyManager] = useState(false);

  const [tenants, setTenants] = useState<TenantInfo[]>([
    { name: "", phone: "", email: "" },
  ]);
  const [tenantErrors, setTenantErrors] = useState<
    Record<number, { name?: string; phone?: string }>
  >({});

  const [leaking, setLeaking] = useState<string>("");
  const [leakingError, setLeakingError] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const totalPhotoBytes = photos.reduce((acc, f) => acc + f.size, 0);

  const validateField = (name: string, value: string) => {
    let error = "";
    if (!value.trim()) {
      if (name === "agency" || name === "message") return "";
      error = "This field is required";
    } else {
      switch (name) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            error = "Please enter a valid email address";
          }
          break;
        case "phone":
          const phoneRegex = /^[0-9+\-\s()]{8,}$/;
          if (!phoneRegex.test(value.trim())) {
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData((p) => ({ ...p, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const toggleArea = (v: string) => {
    setAreas((list) => {
      const newList = list.includes(v)
        ? list.filter((x) => x !== v)
        : [...list, v];
      if (areaError && newList.length > 0) setAreaError(false);
      return newList;
    });
  };

  const toggleService = (v: string) => {
    setServices((list) => {
      const newList = list.includes(v)
        ? list.filter((x) => x !== v)
        : [...list, v];
      if (serviceError && newList.length > 0) setServiceError(false);
      return newList;
    });
  };

  const toggleDamagedTile = (v: string) => {
    setDamagedTiles((list) => {
      let newList: string[];
      if (v === "No" || v === "Not sure") {
        newList = list.includes(v) ? [] : [v];
      } else {
        const filtered = list.filter((x) => x !== "No" && x !== "Not sure");
        newList = filtered.includes(v)
          ? filtered.filter((x) => x !== v)
          : [...filtered, v];
      }
      if (damagedTileError && newList.length > 0) setDamagedTileError(false);
      return newList;
    });
  };

  const selectLeaking = (v: string) => {
    setLeaking((prev) => {
      const next = prev === v ? "" : v;
      if (leakingError && next) setLeakingError(false);
      return next;
    });
  };

  const togglePropertyManager = () => {
    setIsPropertyManager((prev) => !prev);
  };

  const addTenant = () => {
    if (tenants.length < 6) {
      setTenants((prev) => [...prev, { name: "", phone: "", email: "" }]);
    }
  };

  const removeTenant = (idx: number) => {
    setTenants((prev) => prev.filter((_, i) => i !== idx));
    setTenantErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const setTenantCount = (count: number) => {
    setTenants((prev) => {
      if (count > prev.length) {
        const added: TenantInfo[] = Array.from(
          { length: count - prev.length },
          () => ({ name: "", phone: "", email: "" })
        );
        return [...prev, ...added];
      } else if (count < prev.length) {
        return prev.slice(0, count);
      }
      return prev;
    });
  };

  const updateTenant = (idx: number, field: keyof TenantInfo, val: string) => {
    setTenants((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
    if (tenantErrors[idx]?.[field as "name" | "phone"]) {
      setTenantErrors((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], [field]: undefined },
      }));
    }
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);

    // Reset input value so selecting the same files again fires onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Check if any non-image file was selected
    const nonImage = newFiles.find((f) => !f.type.startsWith("image/"));
    if (nonImage) {
      setPhotoError(
        `"${nonImage.name}" is not a supported image. Please select JPG, PNG, or WebP files.`
      );
      return;
    }

    if (photos.length + newFiles.length > MAX_PHOTO_COUNT) {
      setPhotoError(`You can upload a maximum of ${MAX_PHOTO_COUNT} photos.`);
      return;
    }

    const oversized = newFiles.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      setPhotoError(
        `"${oversized.name}" exceeds the ${formatBytes(MAX_FILE_SIZE_BYTES)} per-photo limit.`
      );
      return;
    }

    const updatedPhotos = [...photos, ...newFiles];
    const newTotalSize = updatedPhotos.reduce((acc, f) => acc + f.size, 0);

    if (newTotalSize > MAX_TOTAL_BYTES) {
      setPhotoError(
        `Total photo size (${formatBytes(newTotalSize)}) exceeds our ${formatBytes(
          MAX_TOTAL_BYTES
        )} upload limit.`
      );
    } else {
      setPhotoError("");
    }

    setPhotos(updatedPhotos);
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      const remainingBytes = next.reduce((acc, f) => acc + f.size, 0);
      if (remainingBytes <= MAX_TOTAL_BYTES) {
        setPhotoError("");
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (photoError || totalPhotoBytes > MAX_TOTAL_BYTES) {
      setSubmitError(
        `Total photo size (${formatBytes(totalPhotoBytes)}) exceeds our ${formatBytes(
          MAX_TOTAL_BYTES
        )} upload limit. Please remove a photo before submitting.`
      );
      return;
    }

    const newErrors: Record<string, string> = {};
    const requiredKeys = ["firstName", "lastName", "email", "phone", "address"];
    requiredKeys.forEach((key) => {
      const error = validateField(key, data[key as keyof typeof data]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    setTouched(
      requiredKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );


    const hasAreaError = areas.length === 0;
    const hasServiceError = services.length === 0;
    const hasDamagedTileError = damagedTiles.length === 0;
    const hasLeakingError = !leaking;

    const newTenantErrors: Record<number, { name?: string; phone?: string }> = {};
    let hasTenantError = false;
    if (isPropertyManager) {
      tenants.forEach((t, i) => {
        if (i === 0 || t.name.trim() || t.phone.trim()) {
          const errs: { name?: string; phone?: string } = {};
          if (!t.name.trim()) {
            errs.name = "Name required";
            hasTenantError = true;
          }
          if (!t.phone.trim()) {
            errs.phone = "Phone required";
            hasTenantError = true;
          }
          if (errs.name || errs.phone) {
            newTenantErrors[i] = errs;
          }
        }
      });
    }
    setTenantErrors(newTenantErrors);


    setAreaError(hasAreaError);
    setServiceError(hasServiceError);
    setDamagedTileError(hasDamagedTileError);
    setLeakingError(hasLeakingError);

    if (
      Object.keys(newErrors).length !== 0 ||
      hasTenantError ||
      hasAreaError ||
      hasServiceError ||
      hasDamagedTileError ||
      hasLeakingError
    ) {
      return;
    }

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setSubmitError("Please complete the verification below.");
      return;
    }

    setLoading(true);
    try {
      // 1) Direct browser upload to Cloudinary (bypasses serverless request size limits)
      let uploadedPhotos: Array<{
        name: string;
        contentType: string;
        url: string;
        secureUrl: string;
        publicId: string;
        width?: number;
        height?: number;
        size: number;
        added: string;
      }> = [];

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hsg6orfs";
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "groutix";

      if (photos.length > 0 && cloudName && uploadPreset) {
        try {
          uploadedPhotos = await Promise.all(
            photos.map(async (file) => {
              const cldFormData = new FormData();
              cldFormData.append("file", file);
              cldFormData.append("upload_preset", uploadPreset);
              cldFormData.append("folder", "groutix/quotes");

              const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: cldFormData,
              });

              if (!res.ok) {
                throw new Error(`Upload failed for ${file.name}`);
              }
              const result = await res.json();
              return {
                name: file.name,
                contentType: file.type || "image/jpeg",
                url: result.secure_url || result.url,
                secureUrl: result.secure_url || result.url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                size: result.bytes || file.size,
                added: new Date().toISOString(),
              };
            })
          );
        } catch (cldErr) {
          console.warn("Direct Cloudinary upload failed, falling back to standard submit:", cldErr);
          uploadedPhotos = [];
        }
      }

      const payload = new FormData();
      if (isPropertyManager) {
        payload.append("customerType", "Property Manager");
        if (data.agency) payload.append("agency", data.agency);
        const validTenants = tenants.filter((t) => t.name.trim() || t.phone.trim());
        if (validTenants.length > 0) {
          payload.append("tenants", JSON.stringify(validTenants));
        }
      }
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "agency") payload.append(key, value);
      });
      payload.append("areas", areas.join(", "));
      payload.append("service", services.join(", "));
      payload.append("enquiry", services.join(", "));
      payload.append("damagedTiles", damagedTiles.join(", "));
      payload.append("leaking", leaking);
      payload.append(
        "sourcePage",
        typeof window !== "undefined" ? window.location.pathname : ""
      );
      if (captchaToken) payload.append("cf-turnstile-response", captchaToken);

      if (uploadedPhotos.length > 0) {
        payload.append("uploadedPhotos", JSON.stringify(uploadedPhotos));
      } else {
        // Fallback: send raw files if direct cloud upload was bypassed
        photos.forEach((file) => payload.append("photos", file));
      }

      const res = await fetch("/api/quote", { method: "POST", body: payload });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      turnstileRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setLoading(false);
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
              <h4 className="text-xl font-bold text-neutral-900">
                Quote Request Received!
              </h4>
              <p className="max-w-sm text-[15px] text-neutral-600">
                Thank you. We have received your details and will prepare a
                custom quote for you shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setPhotos([]);
                  setAreas([]);
                  setServices([]);
                  setDamagedTiles([]);
                  setLeaking("");
                  setIsPropertyManager(false);
                  setTenants([{ name: "", phone: "", email: "" }]);
                  setTenantErrors({});
                  setData({
                    firstName: "",
                    lastName: "",
                    agency: "",
                    email: "",
                    phone: "",
                    address: "",
                    message: "",
                  });
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
              className="space-y-4 px-5 py-5 sm:px-6"
            >
              <h3 className="text-center text-xl font-black tracking-tight text-neutral-900">
                Request A Quote
              </h3>

              {/* 1. Customer Details */}
              <div className="space-y-2.5">
                <p className="text-[15px] font-bold text-neutral-900">
                  1. Customer Details
                </p>

                {/* Optional: Property Manager toggle */}
                <div className="pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isPropertyManager}
                        onChange={togglePropertyManager}
                        className="peer sr-only"
                      />
                      <div className={`h-5 w-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${isPropertyManager
                        ? "border-primary bg-primary"
                        : "border-neutral-300 bg-white group-hover:border-neutral-400"
                        }`}>
                        {isPropertyManager && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold text-neutral-700 select-none">
                      I am a Property Manager
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <input
                      name="firstName"
                      value={data.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={
                        isPropertyManager
                          ? "Manager First Name *"
                          : "First Name *"
                      }
                      className={`${fieldStyle} ${touched.firstName && errors.firstName
                        ? "border-red-500 focus:ring-red-500/20"
                        : ""
                        }`}
                    />
                    {touched.firstName && errors.firstName && (
                      <p className="text-[13px] font-semibold text-red-600">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      name="lastName"
                      value={data.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={
                        isPropertyManager
                          ? "Manager Last Name *"
                          : "Last Name *"
                      }
                      className={`${fieldStyle} ${touched.lastName && errors.lastName
                        ? "border-red-500 focus:ring-red-500/20"
                        : ""
                        }`}
                    />
                    {touched.lastName && errors.lastName && (
                      <p className="text-[13px] font-semibold text-red-600">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {isPropertyManager && (
                  <div className="space-y-1">
                    <input
                      name="agency"
                      value={data.agency}
                      onChange={handleChange}
                      placeholder="Real Estate Agency / Company (Optional)"
                      className={fieldStyle}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <input
                      type="email"
                      name="email"
                      value={data.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={
                        isPropertyManager
                          ? "Manager Email *"
                          : "Email *"
                      }
                      className={`${fieldStyle} ${touched.email && errors.email
                        ? "border-red-500 focus:ring-red-500/20"
                        : ""
                        }`}
                    />
                    {touched.email && errors.email && (
                      <p className="text-[13px] font-semibold text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="tel"
                      name="phone"
                      value={data.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={
                        isPropertyManager
                          ? "Manager Phone *"
                          : "Phone *"
                      }
                      className={`${fieldStyle} ${touched.phone && errors.phone
                        ? "border-red-500 focus:ring-red-500/20"
                        : ""
                        }`}
                    />
                    {touched.phone && errors.phone && (
                      <p className="text-[13px] font-semibold text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    name="address"
                    value={data.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={
                      isPropertyManager
                        ? "Rental Property Address *"
                        : "Address *"
                    }
                    className={`${fieldStyle} ${touched.address && errors.address
                      ? "border-red-500 focus:ring-red-500/20"
                      : ""
                      }`}
                  />
                  {touched.address && errors.address && (
                    <p className="text-[13px] font-semibold text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Property Manager: Tenant Details for Site Access */}
                <AnimatePresence>
                  {isPropertyManager && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-3 overflow-hidden rounded-sm border border-primary/20 bg-primary/[0.03] p-3.5 pt-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-[13px] font-bold text-neutral-900">
                            Tenant Access Details
                          </span>
                        </div>

                        {/* Tenant Quick Buttons 1, 2, 3, 4 */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-neutral-500">
                            Tenants:
                          </span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setTenantCount(num)}
                                className={`h-6 min-w-6 rounded-xs px-1.5 text-[11px] font-bold transition-all ${tenants.length === num
                                  ? "bg-primary text-white shadow-xs"
                                  : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                                  }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-[12px] text-neutral-500 leading-tight">
                        Provide tenant details so our technician can coordinate property access directly.
                      </p>

                      {/* Tenant Cards List */}
                      <div className="space-y-2.5">
                        {tenants.map((t, idx) => (
                          <div
                            key={idx}
                            className="space-y-2 rounded-sm border border-neutral-200/80 bg-white p-2.5 shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-bold text-primary">
                                Tenant {idx + 1}
                              </span>
                              {tenants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTenant(idx)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" /> Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div className="space-y-0.5">
                                <input
                                  value={t.name}
                                  onChange={(e) =>
                                    updateTenant(idx, "name", e.target.value)
                                  }
                                  placeholder={`Tenant ${idx + 1} Name *`}
                                  className={`${fieldStyle} ${tenantErrors[idx]?.name
                                    ? "border-red-500 focus:ring-red-500/20"
                                    : ""
                                    }`}
                                />
                                {tenantErrors[idx]?.name && (
                                  <p className="text-[11px] font-semibold text-red-600">
                                    {tenantErrors[idx]?.name}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-0.5">
                                <input
                                  type="tel"
                                  value={t.phone}
                                  onChange={(e) =>
                                    updateTenant(idx, "phone", e.target.value)
                                  }
                                  placeholder={`Tenant ${idx + 1} Phone *`}
                                  className={`${fieldStyle} ${tenantErrors[idx]?.phone
                                    ? "border-red-500 focus:ring-red-500/20"
                                    : ""
                                    }`}
                                />
                                {tenantErrors[idx]?.phone && (
                                  <p className="text-[11px] font-semibold text-red-600">
                                    {tenantErrors[idx]?.phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            <input
                              type="email"
                              value={t.email}
                              onChange={(e) =>
                                updateTenant(idx, "email", e.target.value)
                              }
                              placeholder={`Tenant ${idx + 1} Email (Optional)`}
                              className={fieldStyle}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Add Tenant Button */}
                      {tenants.length < 6 && (
                        <button
                          type="button"
                          onClick={addTenant}
                          className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-primary/40 bg-white px-3 py-2 text-[12px] font-bold text-primary transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.99]"
                        >
                          <Plus className="h-3.5 w-3.5" /> + Add Tenant {tenants.length + 1}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. What area/s are you looking to have serviced? */}
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-neutral-900">
                  2. What area/s are you looking to have serviced? *
                </p>
                <div className="flex flex-wrap gap-2">
                  {AREA_OPTIONS.map((a) => (
                    <Chip
                      key={a}
                      label={a}
                      active={areas.includes(a)}
                      onClick={() => toggleArea(a)}
                    />
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

              {/* 3. What service do you require? */}
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-neutral-900">
                  3. What service do you require? *
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      active={services.includes(s)}
                      onClick={() => toggleService(s)}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {serviceError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[13px] font-semibold text-red-600 overflow-hidden"
                    >
                      Please select at least one service option.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Are you aware of any damaged tiles? */}
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-neutral-900">
                  4. Are you aware of any damaged tiles? *
                </p>
                <div className="flex flex-wrap gap-2">
                  {DAMAGED_TILE_OPTIONS.map((dt) => (
                    <Chip
                      key={dt}
                      label={dt}
                      active={damagedTiles.includes(dt)}
                      onClick={() => toggleDamagedTile(dt)}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {damagedTileError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[13px] font-semibold text-red-600 overflow-hidden"
                    >
                      Please select an option.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* 5. Is the area currently leaking? */}
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-neutral-900">
                  5. Is the area currently leaking? *
                </p>
                <div className="flex flex-wrap gap-2">
                  {LEAKING_OPTIONS.map((l) => (
                    <Chip
                      key={l}
                      label={l}
                      active={leaking === l}
                      onClick={() => selectLeaking(l)}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {leakingError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[13px] font-semibold text-red-600 overflow-hidden"
                    >
                      Please indicate if the area is leaking.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* 6. Tell us more about how we can help */}
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-neutral-900">
                  6. Tell us more about how we can help
                </p>
                <textarea
                  name="message"
                  rows={2}
                  value={data.message}
                  onChange={handleChange}
                  placeholder="Tell us more about how we can help..."
                  className={`${fieldStyle} resize-none`}
                />
              </div>

              {/* 7. Attach photos of the area */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-neutral-900">
                    7. Attach photos of the area
                  </p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowInfo((s) => !s)}
                      aria-label="How to take photos"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-accent text-accent transition-all duration-200 hover:bg-accent hover:text-white"
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
                          <p className="pr-4 font-semibold text-neutral-900">
                            How to take good photos
                          </p>
                          <p className="mt-1">
                            Take clear, well-lit photos of the affected area (a wide shot
                            of the whole shower/balcony plus a close-up of any cracks,
                            mould or damaged tiles.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-[13px] text-neutral-600 leading-snug">
                  For a faster and more accurate quote, please upload clear photos showing
                  the entire area and any areas of concern
                </p>

                <label className="flex flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-neutral-300 bg-white/60 px-4 py-3 text-center transition-all duration-200 cursor-pointer hover:border-secondary hover:bg-white/90">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-neutral-700">
                    <Paperclip className="h-4 w-4 text-neutral-500" />
                    <span>Click to upload photos (optional)</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Up to 10 photos (JPG, PNG, WebP)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotos}
                    className="hidden"
                  />
                </label>

                {/* Inline Photo Validation Error */}
                <AnimatePresence>
                  {photoError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>{photoError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Uploaded Photos List */}
                <AnimatePresence>
                  {photos.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <ul className="space-y-1">
                        {photos.map((f, i) => (
                          <motion.li
                            key={`${f.name}-${i}`}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center justify-between gap-2 rounded-sm border border-neutral-200/80 bg-white/80 px-3 py-1.5 text-[13px] text-neutral-700"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate font-medium">{f.name}</span>
                              <span className="shrink-0 text-[11px] text-neutral-500">
                                ({formatBytes(f.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="shrink-0 text-neutral-400 hover:text-red-600 transition-colors p-0.5"
                              aria-label={`Remove photo ${f.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </motion.li>
                        ))}
                      </ul>

                      {/* Photo Summary */}
                      <div className="flex items-center justify-between px-1 text-[11px] text-neutral-500 font-medium">
                        <span>
                          {photos.length} {photos.length === 1 ? "photo" : "photos"} attached
                        </span>
                        <span className={totalPhotoBytes > MAX_TOTAL_BYTES ? "font-bold text-red-600" : ""}>
                          Total: {formatBytes(totalPhotoBytes)} / {formatBytes(MAX_TOTAL_BYTES)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cloudflare Turnstile (bot verification) */}
              {TURNSTILE_SITE_KEY && (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setCaptchaToken}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => setCaptchaToken("")}
                  options={{ theme: "light", size: "flexible" }}
                />
              )}

              {/* Submit */}
              {submitError && (
                <p className="rounded-sm bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">
                  {submitError}
                </p>
              )}
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
