import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { full_name, email, password } = await req.json();

  if (!full_name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Call Supabase Auth REST API directly — zero dependency on service role
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseAnonKey,
    },
    body: JSON.stringify({
      email,
      password,
      data: { full_name },
    }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    return NextResponse.json({ error: data.error?.message || data.msg || "Registration failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
