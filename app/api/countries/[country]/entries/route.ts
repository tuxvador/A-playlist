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

  const currentYear = new Date().getFullYear();
  const parsedYear = parseInt(String(body.releaseYear || ""), 10);
  const releaseYear = !isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= currentYear
    ? parsedYear
    : currentYear;
  const yearsSinceRelease = currentYear - releaseYear;
  const decade = `${Math.floor(releaseYear / 10) * 10}s`;
  const status = releaseYear >= currentYear - 1 ? "Current release" : "Classic";

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
  const session = getSessionUser(request);
  const userId = session?.userId ?? -1;

  const countryRecord = africanCountries.find((item) => item.slug === params.country);
  if (!countryRecord) {
    return NextResponse.json({ error: "Unknown country." }, { status: 400 });
  }

  const rawEntries = await prisma.entry.findMany({
    where: { country: params.country },
    include: {
      user: { select: { username: true } },
      _count: { select: { votes: true } },
      votes: { where: { userId }, select: { id: true } },
    },
    orderBy: { votes: { _count: "desc" } },
  });

  const entries = rawEntries.map(({ _count, votes, ...e }) => ({
    ...e,
    voteCount: _count.votes,
    userVoted: votes.length > 0,
  }));

  return NextResponse.json({ country: countryRecord, entries });
}
