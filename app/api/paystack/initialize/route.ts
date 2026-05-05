import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, full_name } = body;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || "checkout@learnhub.com",
        amount: 2500000, // ₦25,000 in kobo
        currency: "NGN",
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/register`,
        metadata: {
          source: "landing_page",
          full_name: full_name || "",
          // After payment, Paystack will create a subscription using plan code
          plan: process.env.PAYSTACK_PLAN_CODE, // ₦3,000/month plan
        },
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);
    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
