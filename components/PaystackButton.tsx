"use client";

export default function PaystackButton() {
  const handlePayment = async () => {
    const res = await fetch("/api/paystack/initialize", { method: "POST" });
    const data = await res.json();
    if (data.authorization_url) {
      window.location.href = data.authorization_url;
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors w-full max-w-xs mx-auto block"
    >
      Enroll Now — ₦25,000
    </button>
  );
}
