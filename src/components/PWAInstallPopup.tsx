"use client";

import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "campuscart-pwa-dismissed-at";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 3;

export default function PWAInstallPopup() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);

    const dismissedAtRaw = window.localStorage.getItem(DISMISS_KEY);
    if (dismissedAtRaw) {
      const dismissedAt = Number(dismissedAtRaw);
      if (!Number.isNaN(dismissedAt) && Date.now() - dismissedAt < DISMISS_MS) {
        setIsDismissed(true);
      }
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  const visible = useMemo(() => {
    return isAndroid && !isInstalled && !isDismissed && !!installEvent && !isMobileViewport;
  }, [isAndroid, isInstalled, isDismissed, installEvent, isMobileViewport]);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[120] mx-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-blue-900 dark:bg-slate-900/95">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
          download
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Install CampusCart on your phone
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Add it to your home screen for an app-like experience.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void install();
              }}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Install App
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
