import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CreatorPage() {
  const supabase = await createClient();

  const [
    { count: total },
    { count: pending },
    { count: approved },
    { count: videos },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").eq("status", "approved"),
    supabase.from("videos").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Students", value: total ?? 0, icon: "👥", href: "/creator/students" },
    { label: "Pending Approval", value: pending ?? 0, icon: "⏳", href: "/creator/students" },
    { label: "Approved Students", value: approved ?? 0, icon: "✅", href: "/creator/students" },
    { label: "Videos Uploaded", value: videos ?? 0, icon: "🎬", href: "/creator/curriculum" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Welcome back. Here's what's happening.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-brand transition-colors">
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
