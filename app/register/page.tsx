"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: form.full_name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Registration failed.");
    setSuccess(true);
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm border border-gray-100">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-2xl font-bold mb-3">Application Received!</h2>
        <p className="text-gray-500">Your account is under review. You'll receive an email once you're approved. This usually takes less than 24 hours.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-gray-500 mb-8 text-sm">Already paid? Use the same email from your payment.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Full Name" required
            value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
          />
          <input
            type="email" placeholder="Email Address" required
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
          />
          <input
            type="password" placeholder="Password" required
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
          />
          <input
            type="password" placeholder="Confirm Password" required
            value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link href="/login" className="text-brand hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
