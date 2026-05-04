import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "creator") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-bold text-xl text-brand">LearnHub Creator</span>
          <nav className="flex gap-6 text-sm">
            <Link href="/creator" className="text-gray-600 hover:text-brand transition-colors">Overview</Link>
            <Link href="/creator/students" className="text-gray-600 hover:text-brand transition-colors">Students</Link>
            <Link href="/creator/upload" className="text-gray-600 hover:text-brand transition-colors">Upload Video</Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-gray-500 hover:text-red-500 transition-colors">
            Log out
          </button>
        </form>
      </header>
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
