import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/resend";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await adminSupabase.from("profiles").select("role").eq("id", user.id).single();
  if (!creator || creator.role !== "creator") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id, action } = await req.json();

  const { data: profile } = await adminSupabase.from("profiles").select("full_name, email").eq("id", user_id).single();
  if (!profile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  await adminSupabase.from("profiles").update({ status: action }).eq("id", user_id);

  if (action === "approved") await sendApprovalEmail(profile.email, profile.full_name);
  if (action === "rejected") await sendRejectionEmail(profile.email, profile.full_name);

  return NextResponse.json({ success: true });
}
