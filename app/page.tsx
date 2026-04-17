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
  voteCount: number;
  userVoted: boolean;
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

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function AppleMusicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  );
}

function DeezerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38H6.27zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.61v3.027h5.189V12.61H6.27zm6.271 0v3.027h5.19V12.61h-5.19zm6.27 0v3.027H24V12.61h-5.19zM0 16.83v3.027h5.19V16.83H0zm6.27 0v3.027h5.189V16.83H6.27zm6.271 0v3.027h5.19V16.83h-5.19zm6.27 0v3.027H24V16.83h-5.19z"/>
    </svg>
  );
}

function MusicLinks({ artist, song }: { artist: string; song: string }) {
  const query = encodeURIComponent(`${artist} ${song}`);
  return (
    <div className="music-links">
      <a href={`https://open.spotify.com/search/${query}`} target="_blank" rel="noopener noreferrer" className="music-link spotify" title="Spotify">
        <SpotifyIcon />
      </a>
      <a href={`https://music.apple.com/search?term=${query}`} target="_blank" rel="noopener noreferrer" className="music-link apple" title="Apple Music">
        <AppleMusicIcon />
      </a>
      <a href={`https://www.deezer.com/search/${query}`} target="_blank" rel="noopener noreferrer" className="music-link deezer" title="Deezer">
        <DeezerIcon />
      </a>
    </div>
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
  const [entryForm, setEntryForm] = useState<Record<string, { artist: string; song: string; year: string }>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [fileVotes, setFileVotes] = useState<Record<string, number>>({});
  const [fileVoted, setFileVoted] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<{ id: number; artist: string; song: string } | null>(null);
  const [showMyContributions, setShowMyContributions] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("amm_file_votes");
      const savedVoted = localStorage.getItem("amm_file_voted");
      if (saved) setFileVotes(JSON.parse(saved));
      if (savedVoted) setFileVoted(new Set(JSON.parse(savedVoted)));
    } catch {}
  }, []);

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
    const form = entryForm[countrySlug] || { artist: "", song: "", year: "" };
    const body: { artist: string; song: string; releaseYear?: number } = { artist: form.artist, song: form.song };
    const yearNum = parseInt(form.year, 10);
    if (!isNaN(yearNum)) body.releaseYear = yearNum;
    const res = await fetch(`/api/countries/${countrySlug}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) { setStatus({ text: result.error || tr.entryError, error: true }); return; }
    setStatus({ text: tr.songAdded });
    setEntryForm((prev) => ({ ...prev, [countrySlug]: { artist: "", song: "", year: "" } }));
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
      [country]: { ...(prev[country] || { artist: "", song: "", year: "" }), [field]: value },
    }));
  }

  function toggleFileVote(key: string) {
    const isVoted = fileVoted.has(key);
    const newVotes = { ...fileVotes, [key]: Math.max(0, (fileVotes[key] || 0) + (isVoted ? -1 : 1)) };
    const newVoted = new Set(fileVoted);
    isVoted ? newVoted.delete(key) : newVoted.add(key);
    setFileVotes(newVotes);
    setFileVoted(newVoted);
    try {
      localStorage.setItem("amm_file_votes", JSON.stringify(newVotes));
      localStorage.setItem("amm_file_voted", JSON.stringify([...newVoted]));
    } catch {}
  }

  async function handleEntryEdit(countrySlug: string) {
    if (!editingEntry) return;
    const res = await fetch(`/api/countries/${countrySlug}/entries/${editingEntry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist: editingEntry.artist, song: editingEntry.song }),
    });
    if (!res.ok) { setStatus({ text: tr.editError, error: true }); return; }
    setStatus({ text: tr.entryUpdated });
    setEditingEntry(null);
    setCountries((prev) =>
      prev.map((c) =>
        c.slug !== countrySlug ? c : {
          ...c,
          entries: c.entries.map((e) =>
            e.id !== editingEntry.id ? e : { ...e, artist: editingEntry.artist, song: editingEntry.song }
          ),
        }
      )
    );
  }

  async function handleEntryDelete(countrySlug: string, entryId: number) {
    if (!window.confirm(tr.confirmDelete)) return;
    const res = await fetch(`/api/countries/${countrySlug}/entries/${entryId}`, { method: "DELETE" });
    if (!res.ok) { setStatus({ text: tr.deleteError, error: true }); return; }
    setStatus({ text: tr.entryDeleted });
    setCountries((prev) =>
      prev.map((c) =>
        c.slug !== countrySlug ? c : { ...c, entries: c.entries.filter((e) => e.id !== entryId) }
      )
    );
  }

  async function handleDbVote(countrySlug: string, entryId: number) {
    if (!user) { setStatus({ text: tr.signInToVote, error: true }); return; }
    const res = await fetch(`/api/countries/${countrySlug}/entries/${entryId}/vote`, { method: "POST" });
    if (!res.ok) return;
    const { voteCount, userVoted } = await res.json();
    setCountries((prev) =>
      prev.map((c) =>
        c.slug !== countrySlug ? c : {
          ...c,
          entries: c.entries.map((e) => e.id !== entryId ? e : { ...e, voteCount, userVoted }),
        }
      )
    );
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

  const myContributions = useMemo(() => {
    if (!user) return [];
    const list: { entry: Entry; country: Country }[] = [];
    for (const c of countries) {
      for (const e of c.entries) {
        if (e.user.username === user.username) list.push({ entry: e, country: c });
      }
    }
    return list.sort((a, b) => new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime());
  }, [countries, user]);

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
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  <button type="button" className="button secondary small" onClick={() => setShowMyContributions((v) => !v)}>
                    {tr.myContributions} ({myContributions.length})
                  </button>
                  <button type="button" className="button secondary" onClick={handleLogout}>
                    {tr.logout}
                  </button>
                </div>
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

      {/* ── My contributions panel ── */}
      {user && showMyContributions && (
        <div className="my-contrib-panel">
          <div className="my-contrib-header">
            <h3>{tr.myContributions} <span className="my-contrib-count">{myContributions.length}</span></h3>
            <button type="button" className="button text" onClick={() => setShowMyContributions(false)}>×</button>
          </div>
          {myContributions.length === 0 ? (
            <p className="no-access-note" style={{ paddingTop: 0 }}>{tr.noContributions}</p>
          ) : (
            <ul className="my-contrib-list">
              {myContributions.map(({ entry, country }) => {
                const isEditing = editingEntry?.id === entry.id;
                return (
                  <li key={entry.id} className="my-contrib-item">
                    <div className="my-contrib-info">
                      <span className="my-contrib-flag">{flagFromCode(country.code)}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {isEditing ? (
                          <div className="my-contrib-edit">
                            <input className="input-field inline-edit" value={editingEntry.artist} onChange={(e) => setEditingEntry((prev) => prev && { ...prev, artist: e.target.value })} placeholder={tr.artist}/>
                            <input className="input-field inline-edit" value={editingEntry.song} onChange={(e) => setEditingEntry((prev) => prev && { ...prev, song: e.target.value })} placeholder={tr.song}/>
                          </div>
                        ) : (
                          <>
                            <div className="my-contrib-track"><strong>{entry.artist}</strong> — {entry.song}</div>
                            <div className="my-contrib-meta">{country.name} · ▲ {entry.voteCount}</div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="entry-row-actions">
                      {isEditing ? (
                        <>
                          <button type="button" className="row-action-btn save" onClick={() => handleEntryEdit(country.slug)}>{tr.save}</button>
                          <button type="button" className="row-action-btn cancel" onClick={() => setEditingEntry(null)}>{tr.cancel}</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="row-action-btn edit" onClick={() => setEditingEntry({ id: entry.id, artist: entry.artist, song: entry.song })}>{tr.edit}</button>
                          <button type="button" className="row-action-btn delete" onClick={() => handleEntryDelete(country.slug, entry.id)}>{tr.delete}</button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
                        <label className="input-label">
                          {tr.yearOptional}
                          <input
                            className="input-field"
                            type="number"
                            min={1900}
                            max={new Date().getFullYear()}
                            placeholder={tr.yearPlaceholder}
                            value={entryForm[country.slug]?.year ?? ""}
                            onChange={(e) => updateEntry(country.slug, "year", e.target.value)}
                          />
                        </label>
                        <button type="submit" className="button primary">{tr.addSong}</button>
                      </form>
                    ) : (
                      <p className="no-access-note">{user ? tr.onlyOwnCountry : tr.signInToAdd}</p>
                    )}

                    {dbEntries.length > 0 && (

                      <div className="entries-section">
                        <div className="entries-section-header">
                          <h3 className="entries-section-title">{tr.communityEntriesTitle}</h3>
                          <span className="playlist-count">{dbEntries.length} {tr.songs}</span>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table>
                            <thead>
                              <tr>
                                <th>{tr.artist}</th>
                                <th>{tr.song}</th>
                                <th>{tr.year}</th>
                                <th>{tr.addedBy}</th>
                                <th>{tr.votes}</th>
                                <th>{tr.listen}</th>
                                {user && <th></th>}
                              </tr>
                            </thead>
                            <tbody>
                              {dbEntries.map((entry) => {
                                const canEdit = user && (user.username === entry.user.username || user.isAdmin);
                                const isEditing = editingEntry?.id === entry.id;
                                return (
                                  <tr key={entry.id}>
                                    <td data-label={tr.artist}>
                                      {isEditing
                                        ? <input className="input-field inline-edit" value={editingEntry.artist} onChange={(e) => setEditingEntry((prev) => prev && { ...prev, artist: e.target.value })} />
                                        : entry.artist}
                                    </td>
                                    <td data-label={tr.song}>
                                      {isEditing
                                        ? <input className="input-field inline-edit" value={editingEntry.song} onChange={(e) => setEditingEntry((prev) => prev && { ...prev, song: e.target.value })} />
                                        : entry.song}
                                    </td>
                                    <td data-label={tr.year}>{entry.releaseYear || "—"}</td>
                                    <td data-label={tr.addedBy}>{entry.user.username}</td>
                                    <td data-label={tr.votes}>
                                      <button
                                        type="button"
                                        className={`vote-btn${entry.userVoted ? " voted" : ""}`}
                                        onClick={() => handleDbVote(country.slug, entry.id)}
                                        title={tr.vote}
                                      >
                                        ▲ {entry.voteCount}
                                      </button>
                                    </td>
                                    <td data-label={tr.listen}>
                                      <MusicLinks artist={isEditing ? editingEntry.artist : entry.artist} song={isEditing ? editingEntry.song : entry.song} />
                                    </td>
                                    {user && (
                                      <td data-label="">
                                        {canEdit && (
                                          <div className="entry-row-actions">
                                            {isEditing ? (
                                              <>
                                                <button type="button" className="row-action-btn save" onClick={() => handleEntryEdit(country.slug)}>{tr.save}</button>
                                                <button type="button" className="row-action-btn cancel" onClick={() => setEditingEntry(null)}>{tr.cancel}</button>
                                              </>
                                            ) : (
                                              <>
                                                <button type="button" className="row-action-btn edit" onClick={() => setEditingEntry({ id: entry.id, artist: entry.artist, song: entry.song })}>{tr.edit}</button>
                                                <button type="button" className="row-action-btn delete" onClick={() => handleEntryDelete(country.slug, entry.id)}>{tr.delete}</button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {fileEntries.length > 0 && (
                      <div className="playlist-section">
                        <div className="playlist-section-header">
                          <h3 className="playlist-section-title">{tr.playlistFile}</h3>
                          <span className="playlist-count">{fileEntries.length} {tr.tracks}</span>
                        </div>
                        <ul className="playlist-list">
                          {[...fileEntries.map((item, i) => ({ item, i }))]
                            .sort((a, b) => (fileVotes[`${country.slug}:${b.i}`] || 0) - (fileVotes[`${country.slug}:${a.i}`] || 0))
                            .map(({ item, i }) => {
                            const { artist, song } = parsePlaylistLabel(item);
                            const voteKey = `${country.slug}:${i}`;
                            const voted = fileVoted.has(voteKey);
                            return (
                              <li key={i}>
                                <div className="track-row">
                                  <div className="track-info">
                                    <span className="playlist-artist">{artist}</span>
                                    {song ? (<><span style={{ color: "var(--muted)" }}> — </span><span className="playlist-song">{song}</span></>) : null}
                                  </div>
                                  <div className="track-actions">
                                    <button
                                      type="button"
                                      className={`vote-btn${voted ? " voted" : ""}`}
                                      onClick={() => toggleFileVote(voteKey)}
                                      title={tr.vote}
                                    >
                                      ▲ {fileVotes[voteKey] || 0}
                                    </button>
                                    <MusicLinks artist={artist} song={song || artist} />
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
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
