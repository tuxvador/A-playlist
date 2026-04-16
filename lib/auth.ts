import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "please-set-a-secret";

export type SessionUser = {
  userId: number;
  username: string;
  country: string;
  isAdmin?: boolean;
};

export function createJwt(user: SessionUser) {
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function parseJwt(token: string) {
  try {
    return jwt.verify(token, secret) as SessionUser;
  } catch {
    return null;
  }
}

export function getSessionUser(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(^|;)\s*token=([^;]+)/);
  if (!match) return null;
  return parseJwt(decodeURIComponent(match[2]));
}

export function createSessionCookie(token: string) {
  return `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`;
}
