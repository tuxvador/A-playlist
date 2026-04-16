"use client";

import { useEffect, useMemo, useState } from "react";
import { africanCountries } from "../lib/countries";

function flagFromCode(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

type User = {
  username: string;
  country: string;
  isAdmin?: boolean;
};

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

type Country = {
  slug: string;
  name: string;
  code: string;
  entries: Entry[];
};

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", password: "", country: "" });
  const [entryForm, setEntryForm] = useState<{ [country: string]: { artist: string; song: string } }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const currentCountry = useMemo(() => user?.country || "", [user]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStatus("Logged out successfully.");
  }

  async function fetchData() {
    setLoading(true);
    const [meRes, countriesRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/countries"),
    ]);

    if (meRes.ok) {
      const json = await meRes.json();
      setUser(json.user);
    }

    if (countriesRes.ok) {
      const json = await countriesRes.json();
      setCountries(json.countries);
    }

    setLoading(false);
  }

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error || "Unable to authenticate");
      return;
    }

    setUser(result.user);
    setForm({ username: "", password: "", country: "" });
    await fetchData();
    setStatus("Welcome! You can now add entries for your country.");
  }

  async function handleEntrySubmit(country: string, event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    const body = entryForm[country] || { artist: "", song: "" };

    const response = await fetch(`/api/countries/${country}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error || "Could not add entry.");
      return;
    }

    setStatus("Entry added successfully.");
    setEntryForm((prev) => ({ ...prev, [country]: { artist: "", song: "" } }));
    await fetchData();
  }

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEntry(country: string, field: string, value: string) {
    setEntryForm((prev) => ({
      ...prev,
      [country]: {
        ...(prev[country] || { artist: "", song: "" }),
        [field]: value,
      },
    }));
  }

  return (
    <main className="main">
      <div className="header">
        <div>
          <h1>African Music Map</h1>
          <p>Browse all African countries and add artists with songs for your country.</p>
        </div>
        <div>
          {user ? (
            <div className="card auth-summary">
              <div className="card-header">
                <div>
                  <strong>Signed in as {user.username}</strong>
                  <p>Your country: {user.country}</p>
                  {user.isAdmin ? (
                    <span className="chip">Admin access</span>
                  ) : (
                    <span className="chip">Standard user</span>
                  )}
                </div>
                <button type="button" className="button secondary" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="card auth-summary">
              <p>Create an account or sign in to add entries.</p>
            </div>
          )}
        </div>
      </div>

      {status ? <div className="status">{status}</div> : null}

      {!user ? (
        <div className="card auth-grid">
          <div className="auth-panel">
            <div className="panel-header">
              <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p className="panel-subtitle">
                {authMode === "login"
                  ? "Sign in to manage your country playlist entries."
                  : "Register with your African country to add songs."}
              </p>
            </div>
            <form className="auth-form" onSubmit={handleAuth}>
              <label className="input-label">
                Username
                <input
                  className="input-field"
                  value={form.username}
                  onChange={(event) => updateForm("username", event.target.value)}
                  required
                />
              </label>
              <label className="input-label">
                Password
                <input
                  className="input-field"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  required
                />
              </label>
              {authMode === "register" ? (
                <label className="input-label">
                  Country
                  <select
                    className="input-field"
                    value={form.country}
                    onChange={(event) => updateForm("country", event.target.value)}
                    required
                  >
                    <option value="">Select your country</option>
                    {africanCountries.map((country) => (
                      <option key={country.slug} value={country.slug}>
                        {flagFromCode(country.code)} {country.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <button type="submit" className="button primary">
                {authMode === "login" ? "Log in" : "Create account"}
              </button>
            </form>
            <div className="panel-footer">
              <span>
                {authMode === "login" ? "Need an account?" : "Already have one?"}
              </span>
              <button
                type="button"
                className="button text"
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              >
                {authMode === "login" ? "Register" : "Login"}
              </button>
            </div>
            <p className="tip-text">
              Tip: register with a valid African country such as <strong>nigeria</strong>, <strong>kenya</strong>, or <strong>ghana</strong>.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid">
        {loading ? (
          <div className="card">Loading countries…</div>
        ) : (
          countries.map((country) => (
            <section key={country.slug} className="card country-row">
              <div>
                <h2>{flagFromCode(country.code)} {country.name}</h2>
                <small>{country.entries.length} entries</small>
              </div>

              {user?.country === country.slug || user?.isAdmin ? (
                <form className="entry-form" onSubmit={(event) => handleEntrySubmit(country.slug, event)}>
                  <label className="input-label">
                    Artist
                    <input
                      className="input-field"
                      value={entryForm[country.slug]?.artist || ""}
                      onChange={(event) => updateEntry(country.slug, "artist", event.target.value)}
                      required
                    />
                  </label>
                  <label className="input-label">
                    Song
                    <input
                      className="input-field"
                      value={entryForm[country.slug]?.song || ""}
                      onChange={(event) => updateEntry(country.slug, "song", event.target.value)}
                      required
                    />
                  </label>
                  <button type="submit" className="button primary">Add song for {country.name}</button>
                </form>
              ) : (
                <p>
                  {user ? "You can only add songs for your selected country." : "Sign in to add a song."}
                </p>
              )}

              <table>
                <thead>
                  <tr>
                    <th>Artist</th>
                    <th>Song</th>
                    <th>Release Year</th>
                    <th>Decade</th>
                    <th>Status</th>
                    <th>Added by</th>
                  </tr>
                </thead>
                <tbody>
                  {country.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No entries yet for {country.name}.</td>
                    </tr>
                  ) : (
                    country.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.artist}</td>
                        <td>{entry.song}</td>
                        <td>{entry.releaseYear}</td>
                        <td>{entry.decade}</td>
                        <td>{entry.status}</td>
                        <td>{entry.user.username}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
