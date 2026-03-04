"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = 1 | 2 | 3 | 4;

const CATEGORIES = [
  { value: "books", label: "Books", icon: "📚" },
  { value: "clothes", label: "Clothes", icon: "👕" },
];

const CONDITIONS = [
  { value: "new", label: "New / Unused" },
  { value: "gently_used", label: "Gently Used" },
  { value: "used", label: "Used but Functional" },
];

const TIME_SLOTS = [
  { value: "morning", label: "Morning (9 AM – 12 PM)" },
  { value: "afternoon", label: "Afternoon (12 PM – 4 PM)" },
  { value: "evening", label: "Evening (4 PM – 7 PM)" },
];

const HYDERABAD_AREAS = [
  "Ameerpet", "Banjara Hills", "Begumpet", "Gachibowli", "HITEC City",
  "Jubilee Hills", "Kondapur", "Kukatpally", "LB Nagar", "Madhapur",
  "Manikonda", "Miyapur", "Secunderabad", "Shamshabad", "Toli Chowki",
  "Uppal", "Other",
];

export default function DonationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [category, setCategory] = useState(searchParams.get("category") || "");

  // Step 2
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // Step 3
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

  function canProceed(): boolean {
    switch (step) {
      case 1: return !!category;
      case 2: return !!title && !!condition;
      case 3: return !!donorName && !!donorPhone && !!donorAddress && !!donorPincode;
      default: return true;
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
      router.push("/donate/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-emerald-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Category */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-1">What are you donating?</h2>
          <p className="text-gray-500 text-sm mb-6">Pick a category to get started.</p>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  category === cat.value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <p className="mt-2 font-semibold text-gray-900">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Item details */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-1">Item details</h2>
          <p className="text-gray-500 text-sm mb-6">Tell us about what you&apos;re donating.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Stack of 10 engineering textbooks"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional details about the items..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCondition(c.value)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImage(null);
                      setImagePreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  Click to upload a photo (optional, max 5 MB)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Contact info */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-1">Your details</h2>
          <p className="text-gray-500 text-sm mb-6">
            We need this to coordinate the pickup. Your info stays private.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={donorAddress}
                onChange={(e) => setDonorAddress(e.target.value)}
                placeholder="Full address with landmark"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={donorPincode}
                  onChange={(e) => setDonorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <select
                  value={donorArea}
                  onChange={(e) => setDonorArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Select area</option>
                  {HYDERABAD_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Pickup Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.value}
                    onClick={() => setPreferredSlot(slot.value)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
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
              <span className="text-sm text-gray-600">
                Send me pickup updates on WhatsApp
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold mb-1">Review your donation</h2>
          <p className="text-gray-500 text-sm mb-6">Make sure everything looks good.</p>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-gray-900">Item</h3>
              <p><span className="text-gray-500">Category:</span> {category}</p>
              <p><span className="text-gray-500">Title:</span> {title}</p>
              {description && <p><span className="text-gray-500">Description:</span> {description}</p>}
              <p><span className="text-gray-500">Condition:</span> {condition.replace("_", " ")}</p>
              <p><span className="text-gray-500">Quantity:</span> {quantity}</p>
              {imagePreview && (
                <img src={imagePreview} alt="Donation" className="w-32 h-32 object-cover rounded-lg mt-2" />
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-gray-900">Pickup Details</h3>
              <p><span className="text-gray-500">Name:</span> {donorName}</p>
              <p><span className="text-gray-500">Phone:</span> {donorPhone}</p>
              {donorEmail && <p><span className="text-gray-500">Email:</span> {donorEmail}</p>}
              <p><span className="text-gray-500">Address:</span> {donorAddress}</p>
              <p><span className="text-gray-500">Pincode:</span> {donorPincode}</p>
              {donorArea && <p><span className="text-gray-500">Area:</span> {donorArea}</p>}
              {preferredSlot && <p><span className="text-gray-500">Preferred time:</span> {preferredSlot}</p>}
              <p><span className="text-gray-500">WhatsApp updates:</span> {whatsappOptin ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
            className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Donation"}
          </button>
        )}
      </div>
    </div>
  );
}
