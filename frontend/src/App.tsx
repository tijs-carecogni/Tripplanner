import { useMemo, useState } from "react";

type RemoteStateResponse = {
  found: boolean;
  state?: unknown;
  updatedAt?: string;
};

const STORAGE_KEY = "mindtrip_state_v1";

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function App() {
  const [userId, setUserId] = useState("alex");
  const [tripId, setTripId] = useState("japan-apr-2026");
  const [status, setStatus] = useState("Ready.");
  const [stateText, setStateText] = useState(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.stringify(safeParseJson(local), null, 2) : "{}";
  });
  const apiBase = useMemo(() => `${window.location.origin}/api`, []);

  async function handleSaveRemote() {
    const parsed = safeParseJson(stateText);
    if (!parsed || typeof parsed !== "object") {
      setStatus("State JSON is invalid.");
      return;
    }
    setStatus("Saving to backend...");
    const response = await fetch(`${apiBase}/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tripId, state: parsed }),
    });
    if (!response.ok) {
      setStatus(`Save failed (${response.status}).`);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    setStatus("Saved remotely and locally.");
  }

  async function handleLoadRemote() {
    setStatus("Loading from backend...");
    const response = await fetch(`${apiBase}/state?userId=${encodeURIComponent(userId)}&tripId=${encodeURIComponent(tripId)}`);
    if (!response.ok) {
      setStatus(`Load failed (${response.status}).`);
      return;
    }
    const payload = (await response.json()) as RemoteStateResponse;
    if (!payload.found || !payload.state) {
      setStatus("No remote state found for that user/trip.");
      return;
    }
    setStateText(JSON.stringify(payload.state, null, 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.state));
    setStatus(`Loaded remote state${payload.updatedAt ? ` (${payload.updatedAt})` : ""}.`);
  }

  function handlePullLocal() {
    const local = localStorage.getItem(STORAGE_KEY);
    setStateText(local ? JSON.stringify(safeParseJson(local), null, 2) : "{}");
    setStatus("Pulled from browser localStorage.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="m-0 text-2xl font-semibold text-slate-900">TripMind React Migration (Phase 1)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Framework shell is active. Backend persistence for user/trip state is available now.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            User ID
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-700">
            Trip ID
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-md bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600"
            onClick={handleSaveRemote}
            type="button"
          >
            Save remote state
          </button>
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            onClick={handleLoadRemote}
            type="button"
          >
            Load remote state
          </button>
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            onClick={handlePullLocal}
            type="button"
          >
            Pull from localStorage
          </button>
        </div>
        <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{status}</p>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-slate-900">State JSON</h2>
        <textarea
          className="mt-3 h-[420px] w-full rounded-md border border-slate-300 p-3 font-mono text-xs text-slate-800"
          value={stateText}
          onChange={(event) => setStateText(event.target.value)}
        />
      </section>
    </main>
  );
}

export default App;
