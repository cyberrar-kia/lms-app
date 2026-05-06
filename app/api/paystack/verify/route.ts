import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { reference } = await req.json();
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();

  if (!data.status || data.data?.status !== "success") {
    return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
  }

  // Get logged in user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Update subscription status
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 30);

  await admin.from("profiles").update({
    status: "approved",
    paid: true,
    subscription_status: "active",
    next_payment_date: nextDate.toISOString(),
    payment_ref: reference,
  }).eq("id", user.id);

  return NextResponse.json({ success: true });
}
