import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { createJwt, createSessionCookie } from "../../../../lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();
  const country = String(body.country || "").trim().toLowerCase();

  if (!username || !password || !country) {
    return NextResponse.json({ error: "Please provide a username, password, and country." }, { status: 400 });
  }

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  if (username === adminUsername) {
    return NextResponse.json({ error: "This username is reserved." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists." }, { status: 400 });
  }

  const hashed = await hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hashed, country },
  });

  const token = createJwt({ userId: user.id, username: user.username, country: user.country });
  const response = NextResponse.json({ user: { username: user.username, country: user.country } });
  response.headers.set("Set-Cookie", createSessionCookie(token));
  return response;
}
