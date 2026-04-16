"use client";

import { useEffect, useMemo, useState } from "react";
import { africanCountries } from "../lib/countries";
import { countryPlaylists } from "../lib/countryPlaylists";
import { LANGUAGES, t, type Lang } from "../lib/i18n";

function flagFromCode(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

function parsePlaylistLabel(label: string) {
  const sepIdx = label.search(/\s*[:\-]\s*/);
  if (sepIdx === -1) return { artist: label.trim(), song: "" };
  const artist = label.slice(0, sepIdx).trim();
  const song = label.slice(sepIdx).replace(/^\s*[:\-]\s*/, "").trim();
  return { artist, song };
}

type User = { username: string; country: string; isAdmin?: boolean };

type Entry = {
  id: number;
  artist: string;
  song: string;
  releaseYear: number;
  status: string;
  decade: string;
  yearsSinceRelease: number;
  country: string;
  user: { username: string };
  createdAt: string;
};

type Country = { slug: string; name: string; code: string; entries: Entry[] };

function AppLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="52" height="52" aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
        <linearGradient id="logoWave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981"/>
          <stop offset="100%" stopColor="#34d399"/>
        </linearGradient>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#08080f"/>
      <rect width="64" height="64" rx="14" fill="url(#logoGlow)"/>
      <ellipse cx="28" cy="38" rx="4" ry="2.8" transform="rotate(-18 28 38)" fill="url(#logoGold)"/>
      <line x1="31.5" y1="37" x2="31.5" y2="23" stroke="url(#logoGold)" strokeWidth="2.6" strokeLinecap="round"/>
      <path d="M31.5,23 Q39,27 35,33" fill="none" stroke="url(#logoGold)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M 40,28 Q 44,31 40,34" fill="none" stroke="url(#logoWave)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 43,25 Q 49,31 43,37" fill="none" stroke="url(#logoWave)" strokeWidth="1.8" strokeLinecap="round" opacity="0.65"/>
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`chevron${open ? " open" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
    </svg>
  );
}

function LangSelector({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="lang-selector">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-btn${lang === l.code ? " active" : ""}`}
          onClick={() => setLang(l.code)}
          title={l.label}
          aria-pressed={lang === l.code}
        >
          <span className="lang-flag">{l.flag}</span>
          <span className="lang-label">{l.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

export default function Page() {
  const [lang, setLang] = useState<Lang>("en");
  const tr = t[lang];

  const [user, setUser] = useState<User | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", password: "", country: "" });
  const [entryForm, setEntryForm] = useState<Record<string, { artist: string; song: string }>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const withData = countries
      .filter((c) => c.entries.length > 0 || countryPlaylists[c.slug]?.length > 0)
      .map((c) => c.slug);
    setExpanded(new Set(withData));
  }, [countries]);

  async function fetchData() {
    setLoading(true);
    const [meRes, countriesRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/countries"),
    ]);
    if (meRes.ok) setUser((await meRes.json()).user);
    if (countriesRes.ok) setCountries((await countriesRes.json()).countries);
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStatus({ text: tr.loggedOut });
  }

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!res.ok) { setStatus({ text: result.error || tr.authError, error: true }); return; }
    setUser(result.user);
    setForm({ username: "", password: "", country: "" });
    await fetchData();
    setStatus({ text: tr.welcome });
  }

  async function handleEntrySubmit(countrySlug: string, event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    const body = entryForm[countrySlug] || { artist: "", song: "" };
    const res = await fetch(`/api/countries/${countrySlug}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) { setStatus({ text: result.error || tr.entryError, error: true }); return; }
    setStatus({ text: tr.songAdded });
    setEntryForm((prev) => ({ ...prev, [countrySlug]: { artist: "", song: "" } }));
    await fetchData();
  }

  function toggleCountry(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEntry(country: string, field: string, value: string) {
    setEntryForm((prev) => ({
      ...prev,
      [country]: { ...(prev[country] || { artist: "", song: "" }), [field]: value },
    }));
  }

  const totalFileTracks = useMemo(
    () => Object.values(countryPlaylists).reduce((sum, arr) => sum + arr.length, 0),
    [],
  );
  const countriesWithData = useMemo(
    () => countries.filter((c) => c.entries.length > 0 || (countryPlaylists[c.slug]?.length ?? 0) > 0).length,
    [countries],
  );
  const totalDbEntries = useMemo(
    () => countries.reduce((sum, c) => sum + c.entries.length, 0),
    [countries],
  );

  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) => {
        const aHas = a.entries.length > 0 || (countryPlaylists[a.slug]?.length ?? 0) > 0 ? 1 : 0;
        const bHas = b.entries.length > 0 || (countryPlaylists[b.slug]?.length ?? 0) > 0 ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return a.name.localeCompare(b.name);
      }),
    [countries],
  );

  return (
    <main className="main">
      {/* ── App Header ── */}
      <div className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <AppLogo />
          <div>
            <h1 className="app-title">African Music Map</h1>
            <p className="app-subtitle">{tr.subtitle}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
          <LangSelector lang={lang} setLang={setLang} />

          {user ? (
            <div className="auth-summary">
              <div className="auth-summary-row">
                <div>
                  <p className="auth-username">{user.username}</p>
                  <p className="auth-meta">{tr.country}: {user.country}</p>
                  <span className={`chip ${user.isAdmin ? "admin" : "standard"}`}>
                    {user.isAdmin ? tr.admin : tr.standardUser}
                  </span>
                </div>
                <button type="button" className="button secondary" onClick={handleLogout}>
                  {tr.logout}
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-summary">
              <p style={{ margin: 0, color: "var(--muted-light)", fontSize: "0.9rem" }}>
                {tr.signInPrompt}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats bar ── */}
      {!loading && (
        <div className="stats-bar">
          <div className="stat-pill blue"><strong>{countries.length}</strong> {tr.countries}</div>
          <div className="stat-pill gold"><strong>{totalFileTracks}</strong> {tr.fileSourcedTracks}</div>
          <div className="stat-pill green"><strong>{totalDbEntries}</strong> {tr.communityEntries}</div>
          <div className="stat-pill"><strong>{countriesWithData}</strong> {tr.countriesWithData}</div>
        </div>
      )}

      {/* ── Status banner ── */}
      {status && (
        <div className={`status${status.error ? " error" : ""}`}>{status.text}</div>
      )}

      {/* ── Auth form ── */}
      {!user && (
        <div className="auth-grid">
          <div className="auth-panel">
            <div className="panel-header">
              <h2>{authMode === "login" ? tr.welcomeBack : tr.createAccount}</h2>
              <p className="panel-subtitle">
                {authMode === "login" ? tr.signInSubtitle : tr.registerSubtitle}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleAuth}>
              <label className="input-label">
                {tr.username}
                <input className="input-field" value={form.username} onChange={(e) => updateForm("username", e.target.value)} required/>
              </label>
              <label className="input-label">
                {tr.password}
                <input className="input-field" type="password" value={form.password} onChange={(e) => updateForm("password", e.target.value)} required/>
              </label>
              {authMode === "register" && (
                <label className="input-label">
                  {tr.country}
                  <select className="input-field" value={form.country} onChange={(e) => updateForm("country", e.target.value)} required>
                    <option value="">{tr.selectCountry}</option>
                    {africanCountries.map((c) => (
                      <option key={c.slug} value={c.slug}>{flagFromCode(c.code)} {c.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <button type="submit" className="button primary">
                {authMode === "login" ? tr.logIn : tr.createAccountBtn}
              </button>
            </form>

            <div className="panel-footer">
              <span>{authMode === "login" ? tr.needAccount : tr.alreadyHaveOne}</span>
              <button type="button" className="button text" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                {authMode === "login" ? tr.register : tr.login}
              </button>
            </div>
            <p className="tip-text">
              {tr.tip} <strong>nigeria</strong>, <strong>kenya</strong>, {lang === "fr" ? "ou" : lang === "de" ? "oder" : lang === "es" ? "o" : "or"} <strong>togo</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Countries grid ── */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", color: "var(--muted-light)" }}>
          {tr.loading}
        </div>
      ) : (
        <div className="countries-grid">
          {sortedCountries.map((country) => {
            const fileEntries = countryPlaylists[country.slug] ?? [];
            const dbEntries = country.entries;
            const totalCount = fileEntries.length + dbEntries.length;
            const isOpen = expanded.has(country.slug);
            const hasData = totalCount > 0;

            return (
              <section key={country.slug} className={`country-card ${hasData ? "has-data" : "no-data"}`}>
                <button type="button" className="country-toggle" onClick={() => toggleCountry(country.slug)} aria-expanded={isOpen}>
                  <span className="country-flag" aria-hidden="true">{flagFromCode(country.code)}</span>
                  <span className="country-info">
                    <span className="country-name">{country.name}</span>
                    <span className="country-count">
                      {hasData ? (
                        <><strong>{totalCount}</strong>{" "}{totalCount === 1 ? tr.track : tr.tracks}</>
                      ) : tr.noTracksYet}
                    </span>
                  </span>
                  <span className="country-badges">
                    {fileEntries.length > 0 && <span className="badge file">📁 {fileEntries.length}</span>}
                    {dbEntries.length > 0 && <span className="badge db">✦ {dbEntries.length}</span>}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>

                {isOpen && (
                  <div className="country-body">
                    {user?.country === country.slug || user?.isAdmin ? (
                      <form className="entry-form" onSubmit={(e) => handleEntrySubmit(country.slug, e)}>
                        <label className="input-label">
                          {tr.artist}
                          <input className="input-field" value={entryForm[country.slug]?.artist ?? ""} onChange={(e) => updateEntry(country.slug, "artist", e.target.value)} required/>
                        </label>
                        <label className="input-label">
                          {tr.song}
                          <input className="input-field" value={entryForm[country.slug]?.song ?? ""} onChange={(e) => updateEntry(country.slug, "song", e.target.value)} required/>
                        </label>
                        <button type="submit" className="button primary">{tr.addSong}</button>
                      </form>
                    ) : (
                      <p className="no-access-note">{user ? tr.onlyOwnCountry : tr.signInToAdd}</p>
                    )}

                    {fileEntries.length > 0 && (
                      <div className="playlist-section">
                        <div className="playlist-section-header">
                          <h3 className="playlist-section-title">{tr.playlistFile}</h3>
                          <span className="playlist-count">{fileEntries.length} {tr.tracks}</span>
                        </div>
                        <ul className="playlist-list">
                          {fileEntries.map((item, i) => {
                            const { artist, song } = parsePlaylistLabel(item);
                            return (
                              <li key={i}>
                                <span className="playlist-artist">{artist}</span>
                                {song ? (<><span style={{ color: "var(--muted)" }}> — </span><span className="playlist-song">{song}</span></>) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {dbEntries.length > 0 && (
                      <div className="entries-section">
                        <div className="entries-section-header">
                          <h3 className="entries-section-title">{tr.communityEntriesTitle}</h3>
                          <span className="playlist-count">{dbEntries.length} {tr.songs}</span>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>{tr.artist}</th>
                              <th>{tr.song}</th>
                              <th>{tr.year}</th>
                              <th>{tr.addedBy}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dbEntries.map((entry) => (
                              <tr key={entry.id}>
                                <td>{entry.artist}</td>
                                <td>{entry.song}</td>
                                <td>{entry.releaseYear || "—"}</td>
                                <td>{entry.user.username}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {fileEntries.length === 0 && dbEntries.length === 0 && (
                      <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "16px 0 0" }}>
                        {tr.noEntriesYet(country.name)}
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
