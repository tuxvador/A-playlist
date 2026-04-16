#!/usr/bin/env node
/**
 * parse-playlists.mjs
 *
 * For every file in public/files-playlist/:
 *   1. pdftotext   — direct text layer extraction (PDFs)
 *   2. strings     — raw printable strings from binary
 *   3. tesseract   — OCR on each rendered page (PDF→PNG via pdftoppm, or direct for images)
 *
 * Results from all 3 methods are merged and deduplicated.
 * The union is written to lib/countryPlaylists.ts.
 */

import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, "..");
const FILES_DIR  = path.join(ROOT, "public", "files-playlist");
const OUTPUT     = path.join(ROOT, "lib", "countryPlaylists.ts");
const TMPDIR     = fs.mkdtempSync(path.join(os.tmpdir(), "playlists-"));

// ── Country name → slug mapping ───────────────────────────────────────────────
const NAME_TO_SLUG = {
  togo: "togo", algerie: "algeria", algeria: "algeria", angola: "angola",
  benin: "benin", bénin: "benin", botswana: "botswana",
  "burkina faso": "burkina-faso", "burkina-faso": "burkina-faso",
  burundi: "burundi", "cabo verde": "cabo-verde", "cap-vert": "cabo-verde",
  cameroon: "cameroon", cameroun: "cameroon",
  "central african republic": "central-african-republic",
  chad: "chad", tchad: "chad", comoros: "comoros", comores: "comoros",
  "congo brazzaville": "congo-brazzaville", "congo-brazzaville": "congo-brazzaville",
  "congo kinshasa": "congo-kinshasa", "congo-kinshasa": "congo-kinshasa",
  rdc: "congo-kinshasa", drc: "congo-kinshasa",
  "cote divoire": "cote-divoire", "cote d'ivoire": "cote-divoire",
  "côte d'ivoire": "cote-divoire", "ivory coast": "cote-divoire",
  djibouti: "djibouti", egypt: "egypt", egypte: "egypt",
  "equatorial guinea": "equatorial-guinea", "guinee equatoriale": "equatorial-guinea",
  eritrea: "eritrea", erythree: "eritrea", eswatini: "eswatini",
  ethiopia: "ethiopia", ethiopie: "ethiopia", gabon: "gabon",
  gambia: "gambia", gambie: "gambia", ghana: "ghana",
  guinea: "guinea", guinee: "guinea",
  "guinea bissau": "guinea-bissau", "guinea-bissau": "guinea-bissau",
  "guinee bissau": "guinea-bissau", kenya: "kenya", lesotho: "lesotho",
  liberia: "liberia", libya: "libya", libye: "libya",
  madagascar: "madagascar", malawi: "malawi", mali: "mali",
  mauritania: "mauritania", mauritanie: "mauritania",
  mauritius: "mauritius", "ile maurice": "mauritius",
  morocco: "morocco", maroc: "morocco", mozambique: "mozambique",
  namibia: "namibia", namibie: "namibia", niger: "niger", nigeria: "nigeria",
  rwanda: "rwanda", "sao tome": "sao-tome-and-principe",
  senegal: "senegal", "sénégal": "senegal", seychelles: "seychelles",
  "sierra leone": "sierra-leone", somalia: "somalia", somalie: "somalia",
  "south africa": "south-africa", "afrique du sud": "south-africa",
  "south sudan": "south-sudan", "soudan du sud": "south-sudan",
  sudan: "sudan", soudan: "sudan", tanzania: "tanzania", tanzanie: "tanzania",
  tunisia: "tunisia", tunisie: "tunisia", uganda: "uganda", ouganda: "uganda",
  zambia: "zambia", zambie: "zambia", zimbabwe: "zimbabwe",
};

function filenameToSlug(filename) {
  const base = path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/artistes?\s*/gi, "")
    .replace(/playlist\s*/gi, "")
    .replace(/musique[s]?\s*/gi, "")
    .replace(/music\s*/gi, "")
    .trim();
  if (NAME_TO_SLUG[base]) return NAME_TO_SLUG[base];
  for (const [name, slug] of Object.entries(NAME_TO_SLUG))
    if (base.includes(name)) return slug;
  return null;
}

// ── Extraction methods ────────────────────────────────────────────────────────

function runCmd(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024, ...opts });
  } catch (e) {
    return e.stdout || "";
  }
}

/** Method 1: pdftotext — extract embedded text layer */
function extractPdfToText(filepath) {
  console.log("  [1] pdftotext ...");
  const out = runCmd(`pdftotext -layout "${filepath}" -`);
  console.log(`      → ${out.split("\n").filter(Boolean).length} raw lines`);
  return out;
}

/** Method 2: strings — extract printable strings from binary */
function extractStrings(filepath) {
  console.log("  [2] strings ...");
  // Try binutils strings, then plan9 strings, then fall back to perl one-liner
  const candidates = [
    `strings -n 4 "${filepath}"`,
    `/usr/bin/strings -n 4 "${filepath}"`,
    `/usr/lib/plan9/bin/strings "${filepath}"`,
    `perl -ne 'while (/[\\x20-\\x7e]{4,}/g){ print "$&\\n" }' "${filepath}"`,
  ];
  let out = "";
  for (const cmd of candidates) {
    out = runCmd(cmd);
    if (out.trim()) break;
  }
  console.log(`      → ${out.split("\n").filter(Boolean).length} raw lines`);
  return out;
}

/** Method 3: tesseract OCR
 *  For PDFs: render each page to PNG with pdftoppm, then OCR each PNG.
 *  For images: OCR directly. */
function extractTesseract(filepath) {
  console.log("  [3] tesseract OCR ...");
  const ext = path.extname(filepath).toLowerCase();
  const langs = "fra+eng";
  let combined = "";

  const isPdf = ext === ".pdf";
  const isImage = [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"].includes(ext);

  if (isPdf) {
    // Render PDF pages to PNGs at 200 DPI
    const pagePrefix = path.join(TMPDIR, `page_${Date.now()}`);
    runCmd(`pdftoppm -png -r 200 "${filepath}" "${pagePrefix}"`);
    const pages = fs.readdirSync(TMPDIR)
      .filter((f) => f.startsWith(path.basename(pagePrefix)) && f.endsWith(".png"))
      .sort();

    console.log(`      rendering ${pages.length} page(s) …`);
    for (const page of pages) {
      const imgPath = path.join(TMPDIR, page);
      const outBase = imgPath.replace(".png", "_ocr");
      runCmd(`tesseract "${imgPath}" "${outBase}" -l ${langs} 2>/dev/null`);
      const txtFile = `${outBase}.txt`;
      if (fs.existsSync(txtFile)) {
        combined += fs.readFileSync(txtFile, "utf8") + "\n";
        fs.unlinkSync(txtFile);
      }
      fs.unlinkSync(imgPath);
    }
  } else if (isImage) {
    const outBase = path.join(TMPDIR, `ocr_${Date.now()}`);
    runCmd(`tesseract "${filepath}" "${outBase}" -l ${langs} 2>/dev/null`);
    const txtFile = `${outBase}.txt`;
    if (fs.existsSync(txtFile)) {
      combined = fs.readFileSync(txtFile, "utf8");
      fs.unlinkSync(txtFile);
    }
  } else {
    console.log("      (skipping — not a PDF or image)");
  }

  console.log(`      → ${combined.split("\n").filter(Boolean).length} raw lines`);
  return combined;
}

// ── Line parsing ──────────────────────────────────────────────────────────────

const HEADER_RE = /^(artistes?|playlist|musique[s]?|music)\s+\w+$/i;

/**
 * Lenient parser for clean sources (pdftotext, tesseract).
 */
function parseLines(text) {
  const entries = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.length < 4) continue;
    if (/^\d+$/.test(line)) continue;
    if (HEADER_RE.test(line)) continue;
    if (!/[:\-]/.test(line) && !/\(/.test(line)) continue;
    if (/^(obj|endobj|stream|xref|trailer|startxref|%%EOF)/i.test(line)) continue;
    if (/^[A-Z][a-z]+-[0-9]/.test(line)) continue;
    entries.push(line);
  }
  return entries;
}

/**
 * Strict parser for noisy sources (strings / perl fallback).
 * Requires CapitalizedWord(s) : or - readable text on both sides.
 * Rejects URLs, binary symbols, and lines starting with digits.
 */
function parseLinesStrict(text) {
  const ENTRY_RE = /^[A-ZÀ-Ö][A-Za-zÀ-öÀ-ÿ'.\s]+\s*[:\-]\s*[A-ZÀ-Öa-zà-ÿ'].{2,}$/u;
  const entries = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.length < 6) continue;
    if (/https?:\/\//i.test(line)) continue;
    if (/[<>{}[\]\\|^`~%]/.test(line)) continue;
    if (/^\d/.test(line)) continue;
    if (HEADER_RE.test(line)) continue;
    if (!ENTRY_RE.test(line)) continue;
    entries.push(line);
  }
  return entries;
}

// ── Merge & deduplicate from multiple sources ─────────────────────────────────

function mergeEntries(...sources) {
  const seen = new Set();
  const result = [];
  for (const lines of sources) {
    for (const raw of lines) {
      const line = raw.normalize("NFC").trim();
      const key = line.normalize("NFD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(line);
      }
    }
  }
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!fs.existsSync(FILES_DIR)) {
  console.error(`Directory not found: ${FILES_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(FILES_DIR).filter((f) => !f.startsWith("."));
console.log(`\nFound ${files.length} file(s) in ${FILES_DIR}\n`);

const playlists = {};

for (const filename of files) {
  const filepath = path.join(FILES_DIR, filename);
  if (!fs.statSync(filepath).isFile()) continue;

  const slug = filenameToSlug(filename);
  if (!slug) {
    console.warn(`SKIP: cannot determine country for "${filename}"`);
    continue;
  }

  console.log(`\n── "${filename}" → ${slug} ──`);

  const ext = path.extname(filename).toLowerCase();
  const isPdf   = ext === ".pdf";
  const isImage = [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"].includes(ext);

  // Run all applicable methods
  const textPdf      = isPdf   ? extractPdfToText(filepath)   : "";
  const textStrings  = extractStrings(filepath);
  const textOcr      = (isPdf || isImage) ? extractTesseract(filepath) : "";

  const fromPdf     = parseLines(textPdf);
  const fromStrings = parseLinesStrict(textStrings);
  const fromOcr     = parseLines(textOcr);

  console.log(`\n  Parsed entries — pdftotext:${fromPdf.length}  strings:${fromStrings.length}  tesseract:${fromOcr.length}`);

  const merged = mergeEntries(fromPdf, fromStrings, fromOcr);
  console.log(`  Merged & deduplicated: ${merged.length} unique entries`);

  if (!playlists[slug]) playlists[slug] = [];
  playlists[slug].push(...merged);
}

// Cleanup temp dir
try { fs.rmSync(TMPDIR, { recursive: true }); } catch {}

// ── Manual additions ──────────────────────────────────────────────────────────
const manualEntries = {
  cameroon: ["TIM Kayzer : Viens bb"],
};
for (const [slug, entries] of Object.entries(manualEntries)) {
  if (!playlists[slug]) playlists[slug] = [];
  for (const entry of entries) {
    if (!playlists[slug].includes(entry)) playlists[slug].unshift(entry);
  }
}

// ── NFC-normalize all entries (fix NFD combining accents from OCR/pdftotext) ──
for (const slug of Object.keys(playlists)) {
  playlists[slug] = playlists[slug].map((s) => s.normalize("NFC").trim());
}

// ── Write lib/countryPlaylists.ts ─────────────────────────────────────────────

const body = Object.entries(playlists)
  .map(([slug, entries]) => {
    const lines = entries.map((e) => `    ${JSON.stringify(e)},`).join("\n");
    return `  ${slug}: [\n${lines}\n  ]`;
  })
  .join(",\n");

const output = `// AUTO-GENERATED by scripts/parse-playlists.mjs — do not edit manually
// Extraction: pdftotext + strings + tesseract OCR, merged & deduplicated
export const countryPlaylists: Record<string, string[]> = {
${body}
};
`;

fs.writeFileSync(OUTPUT, output, "utf8");
console.log(`\n✓ Wrote ${OUTPUT}`);
