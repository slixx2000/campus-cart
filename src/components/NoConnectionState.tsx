"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface NoConnectionStateProps {
  onRetry?: () => void;
}

export default function NoConnectionState({ onRetry }: NoConnectionStateProps) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const setStatus = () => setIsOffline(!navigator.onLine);
    setStatus();

    window.addEventListener("online", setStatus);
    window.addEventListener("offline", setStatus);

    return () => {
      window.removeEventListener("online", setStatus);
      window.removeEventListener("offline", setStatus);
    };
  }, []);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  return (
    <section className="relative overflow-hidden px-6 py-12 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/10" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary/15 dark:bg-cyan-300/10" />

      <div className="mx-auto max-w-xl text-center">
        <div className="mb-8 rounded-3xl border border-primary/15 bg-surface p-8 dark:bg-surface">
          <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-surface dark:bg-slate-900/80">
            <span className="material-symbols-outlined text-[96px] text-primary/30">router</span>
            <span className="material-symbols-outlined absolute text-5xl text-primary">wifi_off</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
          No connection right now
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
          Your internet appears to be offline. Reconnect to continue browsing or posting on
          CampusCart.
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Status: {isOffline ? "Offline" : "Connection restored"}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleRetry}
            className="btn-primary px-8 py-3 text-sm"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-surface-2 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
