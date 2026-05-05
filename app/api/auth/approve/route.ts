import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // Verify creator is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify creator role
  const { data: creator } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id, action } = await req.json();

  if (!user_id || !action) {
    return NextResponse.json({ error: "Missing user_id or action" }, { status: 400 });
  }

  // Update the student status
  const { error: updateError } = await admin
    .from("profiles")
    .update({ status: action })
    .eq("id", user_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Try to send email — non-fatal
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    if (profile) {
      const { sendApprovalEmail, sendRejectionEmail } = await import("@/lib/resend");
      if (action === "approved") await sendApprovalEmail(profile.email, profile.full_name);
      if (action === "rejected") await sendRejectionEmail(profile.email, profile.full_name);
    }
  } catch (emailErr) {
    console.error("Email failed (non-fatal):", emailErr);
  }

  return NextResponse.json({ success: true });
}
