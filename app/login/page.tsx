"use client";
import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginAction(form.email, form.password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8 text-sm">Log in to access your course.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account? <Link href="/register" className="text-brand hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
