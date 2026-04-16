import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { africanCountries } from "../../../lib/countries";

export async function GET() {
  const entries = await prisma.entry.findMany({
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  const countriesWithEntries = africanCountries.map((country) => ({
    ...country,
    entries: entries.filter((entry) => entry.country === country.slug),
  }));

  return NextResponse.json({ countries: countriesWithEntries });
}
