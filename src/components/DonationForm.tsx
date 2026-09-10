"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shirt, Camera, X, Plus, Loader2, Package, ArrowRight, Lock } from "lucide-react";

interface Bucket {
  id: string;
  label: string;
  hint: string;
  maxKg: number;
  pricePaise: number;
  priceDisplay: string;
}

interface Config {
  buckets: Bucket[];
  content: { clothesComingSoon: boolean; whatsappNumber: string };
  accepting: boolean;
  remaining: number | null;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (r: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const MAX_PHOTOS = 6;

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function DonationForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<Config | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [category, setCategory] = useState("books");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [bucketId, setBucketId] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorPincode, setDonorPincode] = useState("");
  const [donorCity, setDonorCity] = useState("");
  const [whatsappOptin, setWhatsappOptin] = useState(true);

  // Waitlist (shown instead of payment when we're at capacity)
  const [waitlistDone, setWaitlistDone] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: Config) => {
        setConfig(data);
        if (data.buckets?.length) setBucketId(data.buckets[0].id);
      })
      .catch(() => setError("Could not load donation options. Please refresh."))
      .finally(() => setLoadingConfig(false));
  }, []);

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
    // Intentionally only on unmount — individual removals revoke their own URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedBucket = config?.buckets.find((b) => b.id === bucketId) || null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }
    const accepted: { file: File; preview: string }[] = [];
    for (const file of files.slice(0, room)) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each photo must be under 5 MB");
        continue;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    if (accepted.length) {
      setPhotos((prev) => [...prev, ...accepted]);
      setError("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function formatPhone(val: string) {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
    if (digits.length > 10) digits = digits.slice(0, 10);
    setDonorPhone(digits ? `+91 ${digits}` : "");
  }

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!donorName.trim()) errs.donorName = "Please enter your name";
    if (donorPhone.replace(/\D/g, "").length < 10) errs.donorPhone = "Enter a valid 10-digit phone number";
    if (donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) errs.donorEmail = "Enter a valid email address";
    if (!donorAddress.trim()) errs.donorAddress = "Please enter your pickup address";
    if (donorPincode.length !== 6) errs.donorPincode = "Pincode must be 6 digits";
    if (!bucketId) errs.bucket = "Please pick an approximate weight";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [donorName, donorPhone, donorEmail, donorAddress, donorPincode, bucketId]);

  const handlePay = useCallback(async () => {
    if (!validate() || !selectedBucket) return;

    setSubmitting(true);
    setError("");

    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Could not load the payment window. Check your connection and try again.");

      const formData = new FormData();
      formData.append("category", category);
      formData.append("weightBucket", bucketId);
      formData.append("donorName", donorName);
      formData.append("donorPhone", donorPhone);
      formData.append("donorEmail", donorEmail);
      formData.append("donorAddress", donorAddress);
      formData.append("donorPincode", donorPincode);
      formData.append("donorArea", donorCity);
      formData.append("whatsappOptin", String(whatsappOptin));
      photos.forEach((p) => formData.append("photos", p.file));

      const res = await fetch("/api/donate", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 409 && data.atCapacity) {
        setConfig((c) => (c ? { ...c, accepting: false } : c));
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!key) throw new Error("Payments are not configured. Please contact us.");

      const rzp = new window.Razorpay({
        key,
        amount: data.amount,
        currency: data.currency,
        name: "Givezy",
        description: `Pickup — ${selectedBucket.label}`,
        order_id: data.razorpayOrderId,
        prefill: { name: donorName, email: donorEmail, contact: donorPhone },
        theme: { color: "#059669" },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setError("Payment was cancelled. Your details are still here — try again when you're ready.");
          },
        },
        handler: async (response: RazorpayResponse) => {
          try {
            const verify = await fetch("/api/shipping/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shipmentId: data.shipmentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const vdata = await verify.json();
            if (!verify.ok) throw new Error(vdata.error || "Payment verification failed");
            router.push(`/donate/success?id=${data.donationId}`);
          } catch (err) {
            setSubmitting(false);
            setError(
              err instanceof Error
                ? `${err.message}. If money was deducted, please contact us — we'll sort it out.`
                : "Payment verification failed",
            );
          }
        },
      });

      rzp.open();
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [
    validate, selectedBucket, category, bucketId, donorName, donorPhone, donorEmail,
    donorAddress, donorPincode, donorCity, whatsappOptin, photos, router,
  ]);

  async function handleWaitlist() {
    if (!donorName.trim() || donorPhone.replace(/\D/g, "").length < 10) {
      setFieldErrors({
        ...(donorName.trim() ? {} : { donorName: "Please enter your name" }),
        ...(donorPhone.replace(/\D/g, "").length >= 10 ? {} : { donorPhone: "Enter a valid 10-digit phone number" }),
      });
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: donorName, phone: donorPhone, email: donorEmail,
          pincode: donorPincode, category, weightBucket: bucketId,
        }),
      });
      if (!res.ok) throw new Error("Could not join the waiting list");
      setWaitlistDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingConfig) {
    return (
      <div className="max-w-xl mx-auto flex items-center justify-center gap-2 text-gray-400 py-16">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (waitlistDone) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re on the list</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          We&apos;re at capacity for now. We&apos;ll reach out on {donorPhone} as soon as a pickup slot opens up.
        </p>
      </div>
    );
  }

  const atCapacity = config && !config.accepting;

  return (
    <div className="max-w-xl mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {atCapacity && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-amber-900 text-sm">We&apos;re at capacity right now</p>
          <p className="text-amber-700 text-sm mt-1">
            Leave your name and number and we&apos;ll get in touch the moment a pickup slot opens up.
          </p>
        </div>
      )}

      {/* Category */}
      <h2 className="text-xl font-bold text-gray-900 mb-1">What are you donating today?</h2>
      <p className="text-gray-500 text-sm mb-5">Books today — clothes are on the way.</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setCategory("books")}
          className={`p-5 rounded-xl border-2 text-left transition-all ${
            category === "books" ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <BookOpen className="w-7 h-7 text-amber-600" />
          <p className="mt-2 font-semibold text-gray-900">Books</p>
        </button>

        <button
          disabled={config?.content.clothesComingSoon !== false}
          onClick={() => setCategory("clothes")}
          className={`p-5 rounded-xl border-2 text-left transition-all ${
            config?.content.clothesComingSoon !== false
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-70"
              : category === "clothes"
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Shirt className="w-7 h-7 text-emerald-600" />
          <p className="mt-2 font-semibold text-gray-900">Clothes</p>
          {config?.content.clothesComingSoon !== false && (
            <p className="text-xs text-gray-400 mt-0.5">Launching soon</p>
          )}
        </button>
      </div>

      {/* Photos */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Snap a picture</h3>
      <p className="text-xs text-gray-400 mb-3">Helps us know what&apos;s coming. Optional, up to {MAX_PHOTOS}.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoChange}
        className="hidden"
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-8">
        <AnimatePresence initial={false}>
          {photos.map((p, i) => (
            <motion.div
              key={p.preview}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt={`Donation photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < MAX_PHOTOS && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex flex-col items-center justify-center gap-1"
          >
            {photos.length === 0 ? <Camera className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span className="text-[11px] font-medium">{photos.length === 0 ? "Add photo" : "Add more"}</span>
          </button>
        )}
      </div>

      {/* Weight bucket */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        <Package className="w-3.5 h-3.5 inline mr-1" />
        Approximate weight of the above books
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Pick your best estimate. The courier weighs the package at pickup — if it&apos;s well over what you
        selected, we may need to adjust the charge.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        {config?.buckets.map((b) => (
          <button
            key={b.id}
            onClick={() => setBucketId(b.id)}
            className={`py-3 px-3 rounded-xl border text-left transition-all ${
              bucketId === b.id ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className={`block text-sm font-semibold ${bucketId === b.id ? "text-emerald-700" : "text-gray-800"}`}>
              {b.label}
            </span>
            <span className={`block text-xs mt-0.5 ${bucketId === b.id ? "text-emerald-600" : "text-gray-400"}`}>
              {b.hint}
            </span>
            <span className={`block text-sm font-bold mt-1.5 ${bucketId === b.id ? "text-emerald-700" : "text-gray-600"}`}>
              {b.priceDisplay}
            </span>
          </button>
        ))}
      </div>
      {fieldErrors.bucket && <p className="text-xs text-red-500 mb-2">{fieldErrors.bucket}</p>}

      {/* Payable amount */}
      {selectedBucket && !atCapacity && (
        <div className="flex items-center justify-between bg-gray-900 text-white rounded-xl px-5 py-4 my-6">
          <div>
            <p className="text-xs text-gray-400">Payable amount</p>
            <p className="text-xs text-gray-500 mt-0.5">Covers doorstep pickup, up to {selectedBucket.maxKg} kg</p>
          </div>
          <p className="text-2xl font-bold">{selectedBucket.priceDisplay}</p>
        </div>
      )}

      {/* Details */}
      <h3 className="text-sm font-semibold text-gray-900 mt-8 mb-4">Your details</h3>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" required error={fieldErrors.donorName}>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className={inputClass(!!fieldErrors.donorName)}
            />
          </Field>
          <Field label="Mobile" required error={fieldErrors.donorPhone}>
            <input
              type="tel"
              value={donorPhone}
              onChange={(e) => formatPhone(e.target.value)}
              placeholder="+91 9876543210"
              className={inputClass(!!fieldErrors.donorPhone)}
            />
          </Field>
        </div>

        <Field label="Email" error={fieldErrors.donorEmail}>
          <input
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className={inputClass(!!fieldErrors.donorEmail)}
          />
        </Field>

        <Field label="Pickup address" required error={fieldErrors.donorAddress}>
          <textarea
            value={donorAddress}
            onChange={(e) => setDonorAddress(e.target.value)}
            placeholder="Flat/House no., Building, Street, Landmark"
            rows={2}
            className={`${inputClass(!!fieldErrors.donorAddress)} resize-none`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Pincode" required error={fieldErrors.donorPincode}>
            <input
              type="text"
              inputMode="numeric"
              value={donorPincode}
              onChange={(e) => setDonorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="500001"
              maxLength={6}
              className={inputClass(!!fieldErrors.donorPincode)}
            />
          </Field>
          <Field label="City">
            <input
              type="text"
              value={donorCity}
              onChange={(e) => setDonorCity(e.target.value)}
              placeholder="Hyderabad"
              className={inputClass(false)}
            />
          </Field>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={whatsappOptin}
            onChange={(e) => setWhatsappOptin(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-600">Send me pickup updates on WhatsApp</span>
        </label>
      </div>

      {/* Action */}
      {atCapacity ? (
        <button
          onClick={handleWaitlist}
          disabled={submitting}
          className="w-full mt-8 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Join the waiting list
        </button>
      ) : (
        <>
          <button
            onClick={handlePay}
            disabled={submitting || !selectedBucket}
            className="w-full mt-8 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-emerald-200"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening payment…
              </>
            ) : (
              <>
                Pay {selectedBucket?.priceDisplay ?? ""} now
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400 inline-flex items-center justify-center gap-1 w-full">
            <Lock className="w-3 h-3" />
            Secure payment via Razorpay
          </p>
        </>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors focus:ring-2 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
      : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
  }`;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
