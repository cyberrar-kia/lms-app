import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewStudentNotification } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { full_name, email, password } = await req.json();

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("paystack_reference")
    .eq("status", "success")
    .is("user_id", null)
    .maybeSingle();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user.id;
  const hasPaid = !!existingPayment;

  await supabase.from("profiles").update({
    status: hasPaid ? "approved" : "pending",
    paid: hasPaid,
    payment_ref: existingPayment?.paystack_reference || null,
  }).eq("id", userId);

  if (existingPayment) {
    await supabase.from("payments").update({ user_id: userId }).eq("paystack_reference", existingPayment.paystack_reference);
  }

  if (!hasPaid) {
    await sendNewStudentNotification(full_name, email);
  }

  return NextResponse.json({ success: true, auto_approved: hasPaid });
}
