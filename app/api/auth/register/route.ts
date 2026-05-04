import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { full_name, email, password } = await req.json();

  // Use anon key for signup — this is the standard Supabase flow
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || "Signup failed" }, { status: 400 });
  }

  // Check for existing payment using service role
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existingPayment } = await admin
    .from("payments")
    .select("paystack_reference")
    .eq("status", "success")
    .is("user_id", null)
    .maybeSingle();

  const hasPaid = !!existingPayment;

  // Update profile
  await admin.from("profiles").update({
    status: hasPaid ? "approved" : "pending",
    paid: hasPaid,
    payment_ref: existingPayment?.paystack_reference || null,
  }).eq("id", authData.user.id);

  if (hasPaid && existingPayment) {
    await admin.from("payments")
      .update({ user_id: authData.user.id })
      .eq("paystack_reference", existingPayment.paystack_reference);
  }

  return NextResponse.json({ success: true, auto_approved: hasPaid });
}
