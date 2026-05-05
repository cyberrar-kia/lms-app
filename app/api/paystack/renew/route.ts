import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: profile.email,
        amount: 300000, // ₦3,000 in kobo
        currency: "NGN",
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        metadata: {
          source: "subscription_renewal",
          user_id: user.id,
          plan: process.env.PAYSTACK_PLAN_CODE,
        },
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);
    return NextResponse.json({ authorization_url: data.data.authorization_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
