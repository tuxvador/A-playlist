import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { getSessionUser } from "../../../../../../../lib/auth";
import { africanCountries } from "../../../../../../../lib/countries";

export async function POST(
  request: Request,
  { params }: { params: { country: string; entryId: string } }
) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const entryId = parseInt(params.entryId, 10);
  if (isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });
  }

  const countryRecord = africanCountries.find((item) => item.slug === params.country);
  if (!countryRecord) {
    return NextResponse.json({ error: "Unknown country." }, { status: 400 });
  }

  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry || entry.country !== params.country) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const existing = await prisma.vote.findUnique({
    where: { entryId_userId: { entryId, userId: session.userId } },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
  } else {
    await prisma.vote.create({ data: { entryId, userId: session.userId } });
  }

  const voteCount = await prisma.vote.count({ where: { entryId } });
  return NextResponse.json({ voteCount, userVoted: !existing });
}
