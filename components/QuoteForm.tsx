"use client";

import React, { useMemo, useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

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
  "Billboard",
  "Sponsorship",
  "Vehicle",
  "Flyer",
  "Friend or Family",
  "Real Estate Agent",
  "Other",
];

const STATE_OPTIONS = [
  "Select State",
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
];

export default function QuoteForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    enquiry: "Shower cubicle only",
    message: "",
    service: "shower-regrouting",
    suburb: "",
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [heardFrom, setHeardFrom] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]
    );
  };

  const toggleHeard = (option: string) => {
    setHeardFrom((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      enquiry: "Shower cubicle only",
      message: "",
      service: "shower-regrouting",
      suburb: "",
    });
    setSelectedAreas([]);
    setHeardFrom([]);
  };

  const areaLabel = useMemo(
    () => (selectedAreas.length ? selectedAreas.join(", ") : "Select one or more areas"),
    [selectedAreas]
  );

  const heardLabel = useMemo(
    () => (heardFrom.length ? heardFrom.join(", ") : "How did you hear about us?"),
    [heardFrom]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-[24px] p-8 shadow-[0_24px_90px_rgba(15,23,42,0.12)] flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Request Received!</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Thanks for reaching out, <strong>{formData.firstName}</strong>. One of our local GROUTIX specialists will call you back shortly.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            resetForm();
          }}
          className="mt-4 px-6 py-2 bg-[#001F97] text-white font-semibold rounded-[14px] text-sm hover:bg-[#0025C0] transition-colors"
        >
          Request Another Quote
        </button>
      </div>
    );
  }

  return (
    <form
      id="quote-form"
      onSubmit={handleSubmit}
      className="bg-white/15 backdrop-blur-xl rounded-[24px] p-6 sm:p-8 shadow-[0_24px_90px_rgba(15,23,42,0.16)] border border-white/20 space-y-6 max-w-[540px] mx-auto"
    >
      <div className="space-y-1.5 text-center sm:text-left">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
          Request A Quote
        </h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Complete the form below &amp; we&apos;ll call you back with an obligation-free quote.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="firstName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="First Name"
            className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="lastName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Last Name"
            className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Email"
            className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="phone" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Phone"
            className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="address" className="text-xs font-bold text-slate-700 uppercase tracking-[0.22em]">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address"
          className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="city" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="state" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select State
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all appearance-none"
          >
            {STATE_OPTIONS.map((state) => (
              <option key={state} value={state === "Select State" ? "" : state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-900">What area/s are you looking to have serviced? *</p>
          <span className="text-[11px] text-slate-500">Pick all that apply</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AREA_OPTIONS.map((area) => {
            const active = selectedAreas.includes(area);
            return (
              <button
                type="button"
                key={area}
                onClick={() => toggleArea(area)}
                className={`rounded-[14px] border px-3 py-2 text-sm font-semibold transition-all ${
                  active
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="enquiry" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Is your enquiry about
        </label>
        <select
          id="enquiry"
          name="enquiry"
          value={formData.enquiry}
          onChange={handleChange}
          className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all appearance-none"
        >
          <option value="Shower cubicle only">Shower cubicle only</option>
          <option value="Entire shower regrout">Entire shower regrout</option>
          <option value="Shower base repair">Shower base repair</option>
          <option value="Waterproofing / leaking shower">Waterproofing / leaking shower</option>
          <option value="Tile repair / grout refresh">Tile repair / grout refresh</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="message" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Tell us more about how we can help
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us more about how we can help."
          className="w-full text-sm border border-slate-200 rounded-[16px] px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-900">Where have you heard about us? *</p>
          <span className="text-[11px] text-slate-500">Select one or more</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HEARD_OPTIONS.map((option) => {
            const active = heardFrom.includes(option);
            return (
              <button
                type="button"
                key={option}
                onClick={() => toggleHeard(option)}
                className={`rounded-[14px] border px-3 py-2 text-sm font-semibold transition-all ${
                  active
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 rounded-[16px] border border-slate-200 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Captcha placeholder</p>
        <p className="mt-2 text-xs">This is a visual placeholder for the success badge area shown in the example.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#001F97] hover:bg-[#0025C0] disabled:bg-neutral-300 text-white font-extrabold py-3.5 px-6 rounded-[16px] tracking-wide shadow-xl shadow-[#001F97]/25 transition-all duration-200 transform active:scale-[0.98] cursor-pointer text-base uppercase"
      >
        <span>{loading ? "Sending..." : "Submit Request"}</span>
        {!loading && <Send className="h-4 w-4" />}
      </button>

      <p className="text-[10px] text-center text-neutral-400">
        We respect your privacy. Information submitted is strictly used for quote communication purposes.
      </p>
    </form>
  );
}
