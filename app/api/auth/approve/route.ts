import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { user_id, action } = await req.json();

  if (!user_id || !action) {
    return NextResponse.json({ error: "Missing user_id or action" }, { status: 400 });
  }

  if (!["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Update student status directly
  const { error: updateError } = await admin
    .from("profiles")
    .update({ status: action })
    .eq("id", user_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Try email — non-fatal
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
  } catch (err) {
    console.error("Email failed (non-fatal):", err);
  }

  return NextResponse.json({ success: true });
}
