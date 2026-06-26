"use client";

import { useCallback, useEffect, useState } from "react";

type BumpEvent = {
  id: string;
  listingId: string;
  requestId: string;
  bumpedAt: string;
  listingTitle: string | null;
};

async function readJsonPayload(response: Response): Promise<{ error?: string; events?: BumpEvent[] }> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  if (!raw.trim()) {
    return {};
  }

  if (!contentType.includes("application/json")) {
    return {
      error: response.ok ? "Unexpected response format." : `Request failed with status ${response.status}`,
    };
  }

  try {
    return JSON.parse(raw) as { error?: string; events?: BumpEvent[] };
  } catch {
    return { error: "Could not parse server response." };
  }
}

export default function BumpEventsPage() {
  const [events, setEvents] = useState<BumpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dev/bump-events?limit=30", {
        cache: "no-store",
      });

      const payload = await readJsonPayload(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load bump events.");
      }

      setEvents(payload.events ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load bump events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <div className="min-h-screen bg-background-light px-6 py-10 text-slate-900 dark:bg-[#07111f] dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Bump Event Diagnostics</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Recent bump events for the current signed-in user.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadEvents()}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Refresh
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
          {loading ? (
            <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-300">Loading events...</div>
          ) : error ? (
            <div className="p-8 text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-300">No bump events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Bumped At</th>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3">Listing ID</th>
                    <th className="px-4 py-3">Request ID</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t border-slate-100 dark:border-white/10">
                      <td className="px-4 py-3 font-medium">{new Date(event.bumpedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">{event.listingTitle ?? "Untitled Listing"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {event.listingId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {event.requestId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
