"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type CourseSettings = { id: string; title: string; description: string; price: number; thumbnail_url: string | null };
type Module = { id: string; title: string; lessons: { id: string }[] };
type Profile = { full_name: string; subscription_status: string | null; next_payment_date: string | null; paid: boolean };

export default function DashboardPage() {
  const [course, setCourse] = useState<CourseSettings | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, subscription_status, next_payment_date, paid")
          .eq("id", user.id)
          .single();
        if (p) setProfile(p);
      }

      const { data: cs } = await supabase.from("course_settings").select("*").single();
      if (cs) {
        setCourse(cs);
        if (cs.thumbnail_url) {
          const { data: signedData } = await supabase.storage
            .from("course-covers").createSignedUrl(cs.thumbnail_url, 3600);
          if (signedData?.signedUrl) setCoverUrl(signedData.signedUrl);
        }
      }

      const { data: mods } = await supabase.from("modules").select("id, title").eq("published", true).order("order_index");
      if (mods && mods.length > 0) {
        const { data: vids } = await supabase.from("videos").select("id, module_id").eq("published", true).in("module_id", mods.map(m => m.id));
        setModules(mods.map(m => ({ ...m, lessons: (vids || []).filter(v => v.module_id === m.id) })));
        setTotalLessons((vids || []).length);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse text-brand text-xl">Loading...</div>
    </div>
  );

  const userName = profile?.full_name?.split(" ")[0] || "";
  const nextPayment = profile?.next_payment_date
    ? new Date(profile.next_payment_date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const subExpired = profile?.subscription_status === "expired";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-xl text-brand">LearnHub</span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">Log out</button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back{userName ? `, ${userName}` : ""}! 👋</h1>
          <p className="text-gray-500 mt-2">Ready to continue learning? Pick up where you left off.</p>
        </div>

        {/* Subscription Status Banner */}
        {profile?.paid && (
          <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between ${subExpired ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{subExpired ? "⚠️" : "✅"}</span>
              <div>
                <p className={`font-semibold text-sm ${subExpired ? "text-red-700" : "text-green-700"}`}>
                  {subExpired ? "Subscription Expired" : "Subscription Active"}
                </p>
                {nextPayment && !subExpired && (
                  <p className="text-xs text-green-600">Next renewal: {nextPayment}</p>
                )}
                {subExpired && (
                  <p className="text-xs text-red-600">Renew to continue accessing your course</p>
                )}
              </div>
            </div>
            {subExpired && (
              <a href="/#pricing"
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                Renew — ₦3,000
              </a>
            )}
          </div>
        )}

        {course ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Cover */}
            <div style={{ height: "208px", overflow: "hidden", position: "relative" }}>
              {coverUrl ? (
                <img src={coverUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #6C3DE0, #4B24B0)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "48px" }}>🎓</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>Your Course</span>
                </div>
              )}
              <div style={{ position: "absolute", top: "16px", left: "16px" }}>
                <span style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "white", fontSize: "12px", fontWeight: 600, padding: "6px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.3)" }}>
                  Enrolled ✓
                </span>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h2>
              {course.description && <p className="text-gray-500 leading-relaxed mb-6">{course.description}</p>}

              <div className="flex gap-6 py-6 border-y border-gray-100 mb-6">
                <div className="text-center"><p className="text-2xl font-bold text-gray-900">{modules.length}</p><p className="text-xs text-gray-400 mt-1">Modules</p></div>
                <div className="w-px bg-gray-100" />
                <div className="text-center"><p className="text-2xl font-bold text-gray-900">{totalLessons}</p><p className="text-xs text-gray-400 mt-1">Lessons</p></div>
                <div className="w-px bg-gray-100" />
                <div className="text-center"><p className="text-2xl font-bold text-gray-900">∞</p><p className="text-xs text-gray-400 mt-1">Lifetime Access</p></div>
              </div>

              {modules.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">What's inside</p>
                  <div className="space-y-2">
                    {modules.slice(0, 4).map((mod, i) => (
                      <div key={mod.id} className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="w-6 h-6 rounded-full bg-brand-light text-brand text-xs flex items-center justify-center font-semibold flex-shrink-0">{i + 1}</span>
                        <span>{mod.title}</span>
                        <span className="ml-auto text-xs text-gray-400">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                    {modules.length > 4 && <p className="text-xs text-gray-400 pl-9">+{modules.length - 4} more modules inside</p>}
                  </div>
                </div>
              )}

              {subExpired ? (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-red-700 font-semibold mb-1">Your subscription has expired</p>
                    <p className="text-red-500 text-sm">Renew for ₦3,000/month to regain full access</p>
                  </div>
                  <a href="/#pricing"
                    className="block w-full bg-red-600 hover:bg-red-700 text-white text-center font-bold text-lg py-4 rounded-2xl transition-colors">
                    Renew Subscription — ₦3,000
                  </a>
                </div>
              ) : (
                <Link href="/dashboard/course"
                  className="block w-full bg-brand hover:bg-brand-dark text-white text-center font-bold text-lg py-4 rounded-2xl transition-colors shadow-lg shadow-brand/20">
                  {totalLessons === 0 ? "Preview Course →" : "Start Course →"}
                </Link>
              )}
              <p className="text-center text-xs text-gray-400 mt-4">
                {subExpired ? "Renew to restore access to all lessons" : "You have full access to this course"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p>No course available yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
