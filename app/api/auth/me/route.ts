import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";

export async function GET(request: Request) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: session });
}
