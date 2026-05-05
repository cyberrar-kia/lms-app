import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendPaymentConfirmationEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  // ─── INITIAL PAYMENT (charge.success) ───────────────────────────────────
  if (event.event === "charge.success") {
    const { reference, customer } = event.data;
    const email = customer.email;

    await supabase.from("payments").upsert({
      paystack_reference: reference,
      amount: event.data.amount,
      currency: event.data.currency,
      status: "success",
      verified_at: new Date().toISOString(),
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, status")
      .eq("email", email)
      .single();

    if (profile) {
      await supabase.from("profiles").update({
        status: "approved",
        paid: true,
        payment_ref: reference,
        subscription_status: "active",
      }).eq("id", profile.id);

      try { await sendPaymentConfirmationEmail(email, profile.full_name); } catch (e) { console.error(e); }
    }
  }

  // ─── MONTHLY RENEWAL SUCCESS (invoice.payment) ──────────────────────────
  if (event.event === "invoice.payment") {
    const email = event.data.customer?.email;
    const subscriptionCode = event.data.subscription_code;
    const nextPaymentDate = event.data.subscription?.next_payment_date;

    if (email) {
      await supabase.from("profiles").update({
        status: "approved",
        subscription_status: "active",
        subscription_code: subscriptionCode || null,
        next_payment_date: nextPaymentDate || null,
      }).eq("email", email);
    }
  }

  // ─── SUBSCRIPTION CREATED ────────────────────────────────────────────────
  if (event.event === "subscription.create") {
    const email = event.data.customer?.email;
    const subscriptionCode = event.data.subscription_code;
    const nextPaymentDate = event.data.next_payment_date;

    if (email) {
      await supabase.from("profiles").update({
        subscription_code: subscriptionCode,
        subscription_status: "active",
        next_payment_date: nextPaymentDate || null,
      }).eq("email", email);
    }
  }

  // ─── SUBSCRIPTION DISABLED / PAYMENT FAILED ─────────────────────────────
  if (event.event === "subscription.disable" || event.event === "invoice.payment_failed") {
    const email = event.data.customer?.email;

    if (email) {
      await supabase.from("profiles").update({
        status: "pending",
        subscription_status: "expired",
      }).eq("email", email);
    }
  }

  return NextResponse.json({ received: true });
}
