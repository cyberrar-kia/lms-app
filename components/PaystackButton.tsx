"use client";
import { useState } from "react";

export default function PaystackButton() {
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handlePayment = async () => {
    if (!email || !email.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.authorization_url) window.location.href = data.authorization_url;
    else setError("Payment initialization failed. Try again.");
  };

  if (!showEmailForm) return (
    <button
      onClick={() => setShowEmailForm(true)}
      className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors w-full max-w-xs mx-auto block">
      Enroll Now — ₦25,000
    </button>
  );

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      <input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handlePayment()}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-brand"
        autoFocus
      />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors w-full disabled:opacity-50">
        {loading ? "Redirecting to payment..." : "Pay ₦25,000 →"}
      </button>
      <button onClick={() => setShowEmailForm(false)} className="w-full text-sm text-gray-400 hover:text-gray-600">
        ← Back
      </button>
    </div>
  );
}
