"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shirt, Camera, X, Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import AddressInput from "@/components/AddressInput";

type Step = 1 | 2 | 3;

const CATEGORIES = [
  { value: "books", label: "Books", icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-400" },
  { value: "clothes", label: "Clothes", icon: Shirt, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-400" },
];

const CONDITIONS = [
  { value: "new", label: "New / Unused" },
  { value: "gently_used", label: "Gently Used" },
  { value: "used", label: "Used but Functional" },
];

const TIME_SLOTS = [
  { value: "morning", label: "Morning (9–12)" },
  { value: "afternoon", label: "Afternoon (12–4)" },
  { value: "evening", label: "Evening (4–7)" },
];

const HYDERABAD_AREAS = [
  "Ameerpet", "Banjara Hills", "Begumpet", "Gachibowli", "HITEC City",
  "Jubilee Hills", "Kondapur", "Kukatpally", "LB Nagar", "Madhapur",
  "Manikonda", "Miyapur", "Secunderabad", "Shamshabad", "Toli Chowki",
  "Uppal", "Other",
];

const STEP_LABELS = ["Items", "Details", "Review"];

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.2 } }),
};

export default function DonationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1: Category + Item details
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // Step 2: Contact info
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorPincode, setDonorPincode] = useState("");
  const [donorArea, setDonorArea] = useState("");
  const [whatsappOptin, setWhatsappOptin] = useState(true);
  const [preferredSlot, setPreferredSlot] = useState("");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5 MB");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  }

  function validateField(name: string, value: string) {
    const errors = { ...fieldErrors };
    if (name === "donorPhone" && value && !/^\+?[\d\s-]{10,}$/.test(value)) {
      errors.donorPhone = "Enter a valid 10-digit phone number";
    } else if (name === "donorEmail" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.donorEmail = "Enter a valid email address";
    } else if (name === "donorPincode" && value && value.length !== 6) {
      errors.donorPincode = "Pincode must be 6 digits";
    } else {
      delete errors[name];
    }
    setFieldErrors(errors);
  }

  function formatPhone(val: string) {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
    if (digits.length > 10) digits = digits.slice(0, 10);
    setDonorPhone(digits ? `+91 ${digits}` : "");
  }

  function canProceed(): boolean {
    const noFieldErrors = Object.keys(fieldErrors).length === 0;
    switch (step) {
      case 1: return !!category && !!title && !!condition && noFieldErrors;
      case 2: return !!donorName && !!donorPhone && !!donorAddress && donorPincode.length === 6 && noFieldErrors;
      default: return true;
    }
  }

  function goTo(s: Step) {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  }

  function handleAddressSelect(address: string, pincode?: string, area?: string) {
    setDonorAddress(address);
    if (pincode) setDonorPincode(pincode);
    if (area) {
      const match = HYDERABAD_AREAS.find((a) => area.toLowerCase().includes(a.toLowerCase()));
      if (match) setDonorArea(match);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("category", category);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("condition", condition);
    formData.append("quantity", String(quantity));
    formData.append("donorName", donorName);
    formData.append("donorPhone", donorPhone);
    formData.append("donorEmail", donorEmail);
    formData.append("donorAddress", donorAddress);
    formData.append("donorPincode", donorPincode);
    formData.append("donorArea", donorArea);
    formData.append("whatsappOptin", String(whatsappOptin));
    formData.append("preferredSlot", preferredSlot);
    if (image) formData.append("image", image);

    try {
      const res = await fetch("/api/donate", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }
      const data = await res.json();
      const params = new URLSearchParams({
        id: data.id,
        address: donorAddress,
        name: donorName,
        phone: donorPhone,
      });
      router.push(`/donate/success?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress bar with labels */}
      <div className="flex items-center gap-1 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i + 1 < step
                    ? "bg-emerald-600 text-white"
                    : i + 1 === step
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i + 1 <= step ? "text-emerald-700" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            <div
              className={`h-1 rounded-full transition-all ${
                i + 1 <= step ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        {/* Step 1: Category + Item Details */}
        {step === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">What are you donating?</h2>
            <p className="text-gray-500 text-sm mb-6">Pick a category and tell us about the items.</p>

            {/* Category */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    category === cat.value
                      ? `${cat.border} ${cat.bg}`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <cat.icon className={`w-7 h-7 ${cat.color}`} />
                  <p className="mt-2 font-semibold text-gray-900">{cat.label}</p>
                </button>
              ))}
            </div>

            {/* Item fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Stack of 10 engineering textbooks"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional details..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCondition(c.value)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                        condition === c.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {imagePreview ? (
                    <div className="relative h-[42px] flex items-center gap-2">
                      <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                      <span className="text-sm text-gray-600 truncate flex-1">{image?.name}</span>
                      <button
                        onClick={() => { setImage(null); setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm hover:border-emerald-400 hover:text-emerald-600 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Add photo (optional)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your details</h2>
            <p className="text-gray-500 text-sm mb-6">For coordinating the pickup. Your info stays private.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => formatPhone(e.target.value)}
                  onBlur={() => validateField("donorPhone", donorPhone)}
                  placeholder="+91 9876543210"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${
                    fieldErrors.donorPhone ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-emerald-500"
                  }`}
                />
                {fieldErrors.donorPhone && <p className="text-xs text-red-500 mt-1">{fieldErrors.donorPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  onBlur={() => validateField("donorEmail", donorEmail)}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${
                    fieldErrors.donorEmail ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-emerald-500"
                  }`}
                />
                {fieldErrors.donorEmail && <p className="text-xs text-red-500 mt-1">{fieldErrors.donorEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Address <span className="text-red-400">*</span>
                </label>
                <AddressInput
                  value={donorAddress}
                  onChange={setDonorAddress}
                  onSelect={handleAddressSelect}
                  placeholder="Start typing your address..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={donorPincode}
                    onChange={(e) => setDonorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onBlur={() => validateField("donorPincode", donorPincode)}
                    maxLength={6}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${
                      fieldErrors.donorPincode ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-emerald-500"
                    }`}
                  />
                  {fieldErrors.donorPincode && <p className="text-xs text-red-500 mt-1">{fieldErrors.donorPincode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <select
                    value={donorArea}
                    onChange={(e) => setDonorArea(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition-colors"
                  >
                    <option value="">Select area</option>
                    {HYDERABAD_AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Pickup Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      onClick={() => setPreferredSlot(slot.value)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                        preferredSlot === slot.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
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
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div
            key="step3"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">Review your donation</h2>
            <p className="text-gray-500 text-sm mb-6">Make sure everything looks good before submitting.</p>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">Item Details</h3>
                  <button onClick={() => goTo(1)} className="text-emerald-600 text-xs font-medium hover:underline">Edit</button>
                </div>
                <p><span className="text-gray-400">Category:</span> <span className="text-gray-900 capitalize">{category}</span></p>
                <p><span className="text-gray-400">Title:</span> <span className="text-gray-900">{title}</span></p>
                {description && <p><span className="text-gray-400">Description:</span> <span className="text-gray-900">{description}</span></p>}
                <p><span className="text-gray-400">Condition:</span> <span className="text-gray-900">{condition.replace("_", " ")}</span></p>
                <p><span className="text-gray-400">Quantity:</span> <span className="text-gray-900">{quantity}</span></p>
                {imagePreview && <img src={imagePreview} alt="Donation" className="w-24 h-24 object-cover rounded-lg mt-2" />}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">Pickup Details</h3>
                  <button onClick={() => goTo(2)} className="text-emerald-600 text-xs font-medium hover:underline">Edit</button>
                </div>
                <p><span className="text-gray-400">Name:</span> <span className="text-gray-900">{donorName}</span></p>
                <p><span className="text-gray-400">Phone:</span> <span className="text-gray-900">{donorPhone}</span></p>
                {donorEmail && <p><span className="text-gray-400">Email:</span> <span className="text-gray-900">{donorEmail}</span></p>}
                <p><span className="text-gray-400">Address:</span> <span className="text-gray-900">{donorAddress}</span></p>
                <p><span className="text-gray-400">Pincode:</span> <span className="text-gray-900">{donorPincode}</span></p>
                {donorArea && <p><span className="text-gray-400">Area:</span> <span className="text-gray-900">{donorArea}</span></p>}
                {preferredSlot && <p><span className="text-gray-400">Preferred time:</span> <span className="text-gray-900 capitalize">{preferredSlot}</span></p>}
                <p><span className="text-gray-400">WhatsApp updates:</span> <span className="text-gray-900">{whatsappOptin ? "Yes" : "No"}</span></p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            onClick={() => goTo((step - 1) as Step)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            onClick={() => goTo((step + 1) as Step)}
            disabled={!canProceed()}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-emerald-200"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 hover:shadow-md hover:shadow-emerald-200"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Donation
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
