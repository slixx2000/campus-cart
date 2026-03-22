'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function DownloadsPage() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if user is on an Android device
    const userAgent = navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(userAgent));

    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
                href="https://expo.dev/artifacts/eas/7js5R9VdQjXbH8USoetXMh.apk"
    if (result.outcome === 'accepted') {
      setInstallEvent(null);
    }
  };

  const packageVersion = '1.0.0'; // Match mobile/package.json version

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-surface-light dark:from-background-dark dark:to-surface-dark transition-colors">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Get CampusCart
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            Install the web app instantly on Android from Chrome. APK is available as a fallback.
          </p>

          {/* Android Download Card */}
          <div
            className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 md:p-10 mb-8 border-2 ${
              isAndroid
                ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900'
                : 'border-slate-200 dark:border-slate-700'
            } transition-all`}
          >
            <div className="flex items-center justify-center mb-6">
              {/* Android Logo SVG */}
              <svg
                className="w-16 h-16 text-primary-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.6915026,16.4744748 L21.5044012,10.0151496 L21.5127816,10.0151496 C21.8013399,9.55925865 21.6604513,8.93283392 21.2045604,8.64416962 C20.7486695,8.35550532 20.1222448,8.49639397 19.8336864,8.95228495 L16.84,14.0151496 L13.6,14.0151496 L13.6,3.5 C13.6,2.671572 13.0128167,2 12.3,2 C11.5871833,2 11,2.671572 11,3.5 L11,14.0151496 L7.4,14.0151496 L4.16630635,8.95228495 C3.87746007,8.49639397 3.2510354,8.35550532 2.79514457,8.64416962 C2.33925373,8.93283392 2.19836507,9.55925865 2.48721135,10.0151496 L2.4956,10.0151496 L6.3084974,16.4744748 C6.65840734,17.0544595 7.31412392,17.4 8.06,17.4 L15.94,17.4 C16.6858761,17.4 17.3416093,17.0544595 17.6915026,16.4744748 Z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Android
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Version {packageVersion}
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                Recommended: Install as Web App (PWA)
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Fast install, home screen icon, full-screen app experience, and auto updates.
              </p>
            </div>

            {isInstalled ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded p-4 mb-6">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  CampusCart is already installed on this device.
                </p>
              </div>
            ) : null}

            {!isInstalled && installEvent ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all mb-3 ${
                  isAndroid
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Install CampusCart App
              </button>
            ) : null}

            {/* APK fallback notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-4 mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Fallback:</strong> If install is unavailable on your browser, use the APK build instead.
              </p>
              {!isInstalled && !installEvent && isAndroid ? (
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                  Tip: In Chrome, tap the menu and choose "Install app" or "Add to Home screen" first.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <a
                href="https://expo.dev/artifacts/eas/rFC6NkD2cFaiTDTy5KG9Hh.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-6 py-3 rounded-lg font-semibold transition-all bg-primary-500 text-white hover:bg-primary-600"
              >
                Download Latest Stable APK
              </a>

              <a
                href="https://expo.dev/accounts/campuscartmobile/projects/campus-cart-mobile/builds"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-6 py-3 rounded-lg font-semibold transition-all bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                View All Mobile Builds (EAS)
              </a>

              {/* Local APK Path for Development */}
              <details className="text-left">
                <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium">
                  Developer: Local APK Build Instructions
                </summary>
                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-900 rounded text-sm text-slate-700 dark:text-slate-300 font-mono">
                  <p className="mb-2">Once built locally, the APK will be at:</p>
                  <code className="block bg-slate-800 text-slate-100 p-2 rounded mb-2 overflow-x-auto">
                    mobile/android/app/build/outputs/apk/release/app-release.apk
                  </code>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Run: <code className="bg-slate-800 text-slate-100 px-1">cd mobile && eas build --platform android</code>
                  </p>
                </div>
              </details>
            </div>
          </div>

          {/* iOS Coming Soon */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 md:p-10 border border-slate-200 dark:border-slate-700 opacity-75">
            <div className="flex items-center justify-center mb-4">
              {/* Apple Logo SVG */}
              <svg
                className="w-12 h-12 text-slate-400 dark:text-slate-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.3-3.16-2.53-.87-1.36-1.41-3.63-1.41-5.75 0-3.42 2.08-5.27 4.13-5.27 1.13 0 2.07.85 3.12.85 1.01 0 1.93-.9 3.12-.9 2.1 0 3.71 1.38 4.56 3.53.31.84.46 1.7.46 2.65 0 2.13-.82 4.04-1.71 5.22zM12.06 6.11c-.06.87-.56 1.59-1.6 1.59-.97 0-1.54-.73-1.54-1.6 0-.89.58-1.6 1.63-1.6 1.07 0 1.53.73 1.51 1.61z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              iOS
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Coming soon to the App Store
            </p>
          </div>
        </div>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-6 my-16">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Mobile First
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Browse, message, and manage listings from anywhere on campus
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Student Verified
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Buy and sell with confidence in your campus community
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Instant Transactions
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Buy, sell, and trade in real-time with direct messaging
            </p>
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
