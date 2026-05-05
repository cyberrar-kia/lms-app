import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "creator") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-bold text-xl text-brand">LearnHub Creator</span>
          <nav className="flex gap-6 text-sm">
            <Link href="/creator" className="text-gray-600 hover:text-brand transition-colors">Overview</Link>
            <Link href="/creator/curriculum" className="text-gray-600 hover:text-brand transition-colors">Course Builder</Link>
            <Link href="/creator/students" className="text-gray-600 hover:text-brand transition-colors">Students</Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-gray-500 hover:text-red-500 transition-colors">Log out</button>
        </form>
      </header>
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
