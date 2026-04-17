import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getSessionUser } from "../../../../../../lib/auth";
import { africanCountries } from "../../../../../../lib/countries";

async function getEntryOrFail(entryId: number, country: string) {
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry || entry.country !== country) return null;
  return entry;
}

export async function PATCH(
  request: Request,
  { params }: { params: { country: string; entryId: string } }
) {
  const session = getSessionUser(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const countryRecord = africanCountries.find((c) => c.slug === params.country);
  if (!countryRecord) return NextResponse.json({ error: "Unknown country." }, { status: 400 });

  const entryId = parseInt(params.entryId, 10);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });

  const entry = await getEntryOrFail(entryId, params.country);
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  if (!session.isAdmin && entry.userId !== session.userId) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const body = await request.json();
  const artist = String(body.artist || "").trim();
  const song = String(body.song || "").trim();
  if (!artist || !song) return NextResponse.json({ error: "Artist and song are required." }, { status: 400 });

  const updated = await prisma.entry.update({
    where: { id: entryId },
    data: { artist, song },
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json({ entry: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: { country: string; entryId: string } }
) {
  const session = getSessionUser(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const countryRecord = africanCountries.find((c) => c.slug === params.country);
  if (!countryRecord) return NextResponse.json({ error: "Unknown country." }, { status: 400 });

  const entryId = parseInt(params.entryId, 10);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });

  const entry = await getEntryOrFail(entryId, params.country);
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  if (!session.isAdmin && entry.userId !== session.userId) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  await prisma.vote.deleteMany({ where: { entryId } });
  await prisma.entry.delete({ where: { id: entryId } });

  return NextResponse.json({ ok: true });
}
