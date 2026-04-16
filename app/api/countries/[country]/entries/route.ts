import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionUser } from "../../../../../lib/auth";
import { africanCountries } from "../../../../../lib/countries";

export async function POST(request: Request, { params }: { params: { country: string } }) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!session.isAdmin && session.country !== params.country) {
    return NextResponse.json({ error: "You can only add entries for your selected country." }, { status: 403 });
  }

  const body = await request.json();
  const artist = String(body.artist || "").trim();
  const song = String(body.song || "").trim();

  if (!artist || !song) {
    return NextResponse.json({ error: "Artist and song are required." }, { status: 400 });
  }

  const countryRecord = africanCountries.find((item) => item.slug === params.country);
  if (!countryRecord) {
    return NextResponse.json({ error: "Unknown country." }, { status: 400 });
  }

  const releaseYear = new Date().getFullYear();
  const yearsSinceRelease = new Date().getFullYear() - releaseYear;
  const decade = `${Math.floor(releaseYear / 10) * 10}s`;
  const status = "Current release";

  const entry = await prisma.entry.create({
    data: {
      artist,
      song,
      releaseYear,
      yearsSinceRelease,
      decade,
      status,
      country: params.country,
      userId: session.userId,
    },
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json({ entry });
}

export async function GET(request: Request, { params }: { params: { country: string } }) {
  const countryRecord = africanCountries.find((item) => item.slug === params.country);
  if (!countryRecord) {
    return NextResponse.json({ error: "Unknown country." }, { status: 400 });
  }

  const entries = await prisma.entry.findMany({
    where: { country: params.country },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ country: countryRecord, entries });
}
