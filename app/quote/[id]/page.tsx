"use client";

import { useEffect, useState, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  Calendar,
  PenTool,
  RotateCcw,
  Sparkles,
  Download,
  AlertCircle,
  Phone,
  ArrowRight,
} from "lucide-react";

interface QuoteItem {
  service?: string;
  description?: string;
  scope?: string;
  price?: number;
  qty?: number;
}

interface QuoteData {
  id: string;
  quoteNumber: string;
  jobNo?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  service?: string;
  jobDescription?: string;
  items: QuoteItem[];
  subtotal: number;
  gst: number;
  total: number;
  status?: string;
  quoteAcceptedAt?: string;
  quoteSignedAt?: string;
  quoteSignature?: string;
  quoteSignedName?: string;
  bookingUrl: string;
}

const SIGNATURE_FONTS = [
  { id: "caveat", name: "Modern Script", family: "'Caveat', cursive", scale: 1 },
  { id: "dancing", name: "Elegant Cursive", family: "'Dancing Script', cursive", scale: 0.9 },
  { id: "marck", name: "Classic Signature", family: "'Marck Script', cursive", scale: 0.85 },
];

export default function QuoteSignPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  // Signing state
  const [mode, setMode] = useState<"font" | "draw">("font");
  const [signerName, setSignerName] = useState("");
  const [fontIndex, setFontIndex] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  // Drawing canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  // Fetch quote details
  useEffect(() => {
    if (!id || !token) {
      setError("This quotation link is missing or invalid.");
      setLoading(false);
      return;
    }

    fetch(`/api/quote/sign?id=${id}&token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok || !data.quote) {
          setError(data.error || "Quotation could not be loaded.");
        } else {
          setQuote(data.quote);
          setSignerName(data.quote.name || "");
          if (data.quote.quoteSignedAt || data.quote.quoteSignature) {
            setSuccess(true);
            setPdfUrl(`/api/quote/pdf/${id}?token=${token}`);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error while loading quotation.");
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  // Load Google Fonts for signatures
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&family=Marck+Script&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Setup drawing canvas
  useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#001f97";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [mode]);

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawing.current = true;
    hasDrawn.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    isDrawing.current = false;
  }

  function clearDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn.current = false;
    }
  }

  // Generate a signature PNG from the stylish font
  async function generateFontSignatureDataUrl(name: string, jobRef: string): Promise<string> {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Selected font
    const selectedFont = SIGNATURE_FONTS[fontIndex] || SIGNATURE_FONTS[0];
    await document.fonts.load(`58px ${selectedFont.family}`);

    // Signature name
    ctx.font = `64px ${selectedFont.family}`;
    ctx.fillStyle = "#001f97";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.trim() || "Customer", canvas.width / 2, 70);

    // Subtle baseline
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 31, 151, 0.2)";
    ctx.lineWidth = 1;
    ctx.moveTo(80, 115);
    ctx.lineTo(520, 115);
    ctx.stroke();

    // Verification watermark text underneath
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#64748b";
    const dateStr = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
    ctx.fillText(`Digitally verified • ${jobRef} • ${dateStr}`, canvas.width / 2, 140);

    return canvas.toDataURL("image/png");
  }

  async function handleConfirmAndSign() {
    if (!quote) return;
    if (!agreeTerms) {
      alert("Please check the box to agree to the terms and conditions.");
      return;
    }

    setSubmitting(true);
    try {
      let signatureDataUrl = "";

      if (mode === "font") {
        if (!signerName.trim()) {
          alert("Please enter your full name for the signature.");
          setSubmitting(false);
          return;
        }
        signatureDataUrl = await generateFontSignatureDataUrl(signerName, quote.quoteNumber);
      } else {
        if (!hasDrawn.current || !canvasRef.current) {
          alert("Please draw your signature in the box provided.");
          setSubmitting(false);
          return;
        }
        signatureDataUrl = canvasRef.current.toDataURL("image/png");
      }

      const res = await fetch("/api/quote/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quote.id,
          token,
          signatureDataUrl,
          signerName: signerName.trim() || quote.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to sign quote.");
      }

      setPdfUrl(`/api/quote/pdf/${quote.id}?token=${token}`);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while signing the quote.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#001f97] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading your quotation…</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Quotation Notice</h1>
          <p className="text-sm text-slate-600">{error || "Unable to find this quote."}</p>
          <div className="pt-2">
            <a
              href="tel:1300476884"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#001f97] text-white text-xs font-bold hover:bg-[#001777] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Call 1300 476 884
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand Header */}
        <header className="flex items-center justify-between bg-white rounded-2xl p-5 px-6 shadow-xs border border-slate-200">
          <div>
            <div className="text-2xl font-black text-[#001f97] tracking-tight">GROUTIX</div>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
              Stay Sealed. Stay Smiling.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-500">Need Help?</div>
            <a
              href="tel:1300476884"
              className="text-sm font-black text-[#001f97] hover:underline flex items-center gap-1.5 justify-end"
            >
              <Phone className="w-3.5 h-3.5" /> 1300 476 884
            </a>
          </div>
        </header>

        {/* Success Screen if Already Signed */}
        {success ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-emerald-100 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide uppercase">
                Quotation Accepted &amp; Signed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Thank you, {signerName || quote.name}!
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
                Your acceptance for <strong>{quote.quoteNumber}</strong> has been confirmed. A signed copy of your agreement has been sent to your email.
              </p>
            </div>

            {/* Next Step Call to Action */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#001f97]/5 to-[#001f97]/10 border border-[#001f97]/20 max-w-lg mx-auto space-y-4 text-left">
              <div className="flex items-center gap-2 text-[#001f97] font-bold text-sm">
                <Calendar className="w-4 h-4" /> Next Step: Pick your service date
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose a day and time that suits your schedule. Our certified technician will arrive on time with all specialised equipment.
              </p>
              <a
                href={quote.bookingUrl}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#001f97] hover:bg-[#001777] text-white text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                📅 Select Job Date &amp; Time <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Download PDF button */}
            {pdfUrl && (
              <div className="pt-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Signed PDF Copy
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Quote Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#001f97] bg-[#001f97]/10 px-2.5 py-0.5 rounded-full mb-1">
                    Official Quotation
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {quote.quoteNumber}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Issued by Groutix Australia Pty Ltd • ACN: 687 415 005
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold">Total Amount (AUD)</div>
                  <div className="text-2xl sm:text-3xl font-black text-[#001f97]">
                    ${quote.total.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Includes 10% GST</div>
                </div>
              </div>

              {/* Client & Property Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-xs border border-slate-100">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                    Client Details
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{quote.name || "Customer"}</div>
                  {quote.phone && <div className="text-slate-600 mt-0.5">{quote.phone}</div>}
                  {quote.email && <div className="text-slate-600">{quote.email}</div>}
                </div>

                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                    Property / Site Address
                  </span>
                  <div className="font-medium text-slate-800">
                    {quote.address || "Address provided during inspection"}
                  </div>
                </div>
              </div>

              {/* Job Scope / Description */}
              {quote.jobDescription && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Scope of Works
                  </h3>
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {quote.jobDescription}
                  </div>
                </div>
              )}

              {/* Itemized Pricing Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Itemized Quotation Breakdown
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3.5">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quote.items.length > 0 ? (
                        quote.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-800">{it.service || "Restoration Work"}</div>
                              {it.description && (
                                <div className="text-[11px] text-slate-500 mt-0.5">{it.description}</div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600">{it.qty || 1}</td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              ${Number(it.price || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                              ${(Number(it.price || 0) * Number(it.qty || 1)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-3 px-3.5 font-bold text-slate-800">{quote.service}</td>
                          <td className="py-3 px-3 text-center text-slate-600">1</td>
                          <td className="py-3 px-3 text-right text-slate-600">${quote.subtotal.toFixed(2)}</td>
                          <td className="py-3 px-3.5 text-right font-bold text-slate-900">${quote.total.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50/70 border-t border-slate-200 font-medium">
                      <tr>
                        <td colSpan={3} className="py-2 px-3.5 text-right text-slate-500">
                          Subtotal:
                        </td>
                        <td className="py-2 px-3.5 text-right text-slate-800 font-bold">
                          ${quote.subtotal.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-1.5 px-3.5 text-right text-slate-500">
                          GST (10%):
                        </td>
                        <td className="py-1.5 px-3.5 text-right text-slate-800">
                          ${quote.gst.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-200 text-sm">
                        <td colSpan={3} className="py-3 px-3.5 text-right font-black text-[#001f97]">
                          Total Payable (AUD):
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-[#001f97]">
                          ${quote.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Warranty Notice */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-950">Groutix 10-Year Waterproof Warranty Included</div>
                  <div className="text-emerald-800 mt-0.5 leading-relaxed">
                    Full shower restoration and epoxy regrouting works are backed by our comprehensive 10-year written warranty certificate upon completion.
                  </div>
                </div>
              </div>
            </div>

            {/* E-SIGNATURE SECTION */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-[#001f97]/30 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#001f97]">
                  <Sparkles className="w-4 h-4" /> Official Digital Signature &amp; Acceptance
                </div>
                <h2 className="text-xl font-black text-slate-900">Sign to Confirm Quotation</h2>
                <p className="text-xs text-slate-500">
                  Select your signature style below to confirm and return your approved quote.
                </p>
              </div>

              {/* Mode Toggle: Stylish Font vs Draw */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => setMode("font")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mode === "font"
                      ? "bg-[#001f97] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Stylish Signature (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("draw")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mode === "draw"
                      ? "bg-[#001f97] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" /> Draw by Hand / Touch
                </button>
              </div>

              {mode === "font" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-[#001f97] transition-colors"
                    />
                  </div>

                  {/* Font Choice Switcher */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Choose Signature Font Style:
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {SIGNATURE_FONTS.map((f, idx) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFontIndex(idx)}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            fontIndex === idx
                              ? "border-[#001f97] bg-[#001f97]/5 text-[#001f97] ring-2 ring-[#001f97]/20"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Signature Preview Box */}
                  <div className="p-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 text-center relative overflow-hidden shadow-inner">
                    <div className="text-[10px] uppercase font-bold text-slate-400 absolute top-3 left-3 tracking-wider">
                      Live Signature Preview
                    </div>
                    <div
                      className="text-4xl sm:text-5xl text-[#001f97] py-6 select-none font-normal"
                      style={{ fontFamily: SIGNATURE_FONTS[fontIndex].family }}
                    >
                      {signerName.trim() || "Your Signature"}
                    </div>
                    <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Digitally signed for {quote.quoteNumber}</span>
                      <span>{new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Draw with your finger (mobile) or mouse
                    </span>
                    <button
                      type="button"
                      onClick={clearDrawing}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear Box
                    </button>
                  </div>
                  <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={560}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-44 cursor-crosshair touch-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Sign inside the white box above
                  </p>
                </div>
              )}

              {/* Agreement Checkbox */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#001f97] focus:ring-[#001f97] border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    I have reviewed the quotation details above and agree to the{" "}
                    <a
                      href="https://groutix.com.au/terms-conditions"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#001f97] font-bold underline"
                    >
                      Groutix Official Terms &amp; Conditions
                    </a>
                    . I confirm my acceptance of <strong>{quote.quoteNumber}</strong> for the total amount of{" "}
                    <strong>${quote.total.toFixed(2)} AUD</strong>.
                  </span>
                </label>
              </div>

              {/* Confirm & Sign Button */}
              <button
                type="button"
                disabled={submitting || !agreeTerms}
                onClick={handleConfirmAndSign}
                className="w-full py-4 px-6 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-base font-black shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Signed Contract &amp; Confirming…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Confirm &amp; Sign Quotation
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-400">
                🔒 Protected by 256-bit SSL encryption. Once signed, an official copy will be sent to your email.
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pt-6 pb-12 space-y-1">
          <div>Groutix Australia Pty Ltd • Melbourne, Victoria</div>
          <div>1300 476 884 • info@groutix.com • www.groutix.com</div>
        </footer>
      </div>
    </div>
  );
}
