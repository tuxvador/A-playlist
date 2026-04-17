import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { africanCountries } from "../../../lib/countries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { getSessionUser } = await import("../../../lib/auth");
  const session = getSessionUser(request);
  const userId = session?.userId ?? -1;

  const rawEntries = await prisma.entry.findMany({
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

  const countriesWithEntries = africanCountries.map((country) => ({
    ...country,
    entries: entries.filter((entry) => entry.country === country.slug),
  }));

  return NextResponse.json({ countries: countriesWithEntries });
}
