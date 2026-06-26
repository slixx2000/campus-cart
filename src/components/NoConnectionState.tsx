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
      <div className="pointer-events-none absolute inset-0 -z-10 dark:fluid-gradient-dark" />
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[90px] dark:bg-sky-300/10" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary/15 blur-[100px] dark:bg-cyan-300/10" />

      <div className="mx-auto max-w-xl text-center">
        <div className="mb-8 rounded-3xl border border-primary/15 bg-white/70 p-8 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/80">
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
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-sky-400 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:shadow-primary/40 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950 dark:shadow-sky-400/25"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
