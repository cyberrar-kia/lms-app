"use server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password." };

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile) return { error: "Profile not found. Contact support." };
  if (profile.role === "creator") redirect("/creator");
  if (profile.status === "approved") redirect("/dashboard");
  if (profile.status === "rejected") return { error: "Your application was not approved." };

  redirect("/pending");
}
