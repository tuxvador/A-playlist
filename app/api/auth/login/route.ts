import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import fs from "fs";
import path from "path";
import { prisma } from "../../../../lib/prisma";
import { createJwt, createSessionCookie } from "../../../../lib/auth";

function loadAdminConfig() {
  const envPath = path.join(process.cwd(), ".env");
  const env = { ADMIN_USERNAME: "admin", ADMIN_PASSWORD_HASH: "" };

  if (!fs.existsSync(envPath)) {
    return env;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=([\s\S]*)$/);
    if (!match) continue;

    const key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith("\"") && value.endsWith("\"")) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("\'") && value.endsWith("\'")) {
      value = value.slice(1, -1);
    }

    if (key === "ADMIN_USERNAME" || key === "ADMIN_PASSWORD_HASH") {
      env[key] = value;
    }
  }

  return env;
}

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = loadAdminConfig();
  if (username === ADMIN_USERNAME && ADMIN_PASSWORD_HASH) {
    const isAdmin = await compare(password, ADMIN_PASSWORD_HASH);
    if (!isAdmin) {
      return NextResponse.json({ error: "Invalid login." }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({
        data: { username, password: ADMIN_PASSWORD_HASH, country: "all" },
      });
    }

    const token = createJwt({ userId: user.id, username: user.username, country: user.country, isAdmin: true });
    const response = NextResponse.json({ user: { username: user.username, country: user.country, isAdmin: true } });
    response.headers.set("Set-Cookie", createSessionCookie(token));
    return response;
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "Invalid login." }, { status: 401 });
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid login." }, { status: 401 });
  }

  const token = createJwt({ userId: user.id, username: user.username, country: user.country });
  const response = NextResponse.json({ user: { username: user.username, country: user.country } });
  response.headers.set("Set-Cookie", createSessionCookie(token));
  return response;
}
