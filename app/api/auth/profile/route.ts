import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { access_token } = await req.json();
  if (!access_token) return NextResponse.json({ error: "No token" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the token and get the user
  const { data: { user }, error } = await admin.auth.getUser(access_token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile });
}
