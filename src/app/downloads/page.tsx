'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
  content_type?: string;
}

interface GitHubRelease {
  tag_name?: string;
  name?: string;
  assets?: GitHubReleaseAsset[];
  html_url?: string;
}

export default function DownloadsPage() {
  const mobileRepoUrl = 'https://github.com/slixx2000/campus-cart';
  const mobileReleasesUrl = 'https://github.com/slixx2000/campus-cart/releases';
  const fallbackReleaseVersion = '1.1.0';
  const fallbackApkUrl = 'https://github.com/slixx2000/campus-cart/releases/download/v1.1.0/campuscart.apk';

  const [latestReleaseVersion, setLatestReleaseVersion] = useState(fallbackReleaseVersion);
  const [latestApkUrl, setLatestApkUrl] = useState(fallbackApkUrl);
  const [latestReleaseUrl, setLatestReleaseUrl] = useState(`https://github.com/slixx2000/campus-cart/releases/tag/v${fallbackReleaseVersion}`);

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

    const loadLatestRelease = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/slixx2000/campus-cart/releases/latest', {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        if (!response.ok) return;

        const release = (await response.json()) as GitHubRelease;
        const tagName = String(release?.tag_name ?? release?.name ?? '').replace(/^v/i, '');
        const assets = Array.isArray(release?.assets) ? release.assets : [];
        const apkAsset = assets.find((asset) => {
          const name = typeof asset?.name === 'string' ? asset.name.toLowerCase() : '';
          return typeof asset?.browser_download_url === 'string' && (name.endsWith('.apk') || asset?.content_type === 'application/vnd.android.package-archive');
        });

        if (tagName) {
          setLatestReleaseVersion(tagName);
          setLatestReleaseUrl(typeof release?.html_url === 'string' ? release.html_url : `https://github.com/slixx2000/campus-cart/releases/tag/v${tagName}`);
        }

        if (typeof apkAsset?.browser_download_url === 'string') {
          setLatestApkUrl(apkAsset.browser_download_url);
        } else if (typeof release?.html_url === 'string') {
          setLatestApkUrl(release.html_url);
        }
      } catch {
        // Keep the fallback release URLs when GitHub is unavailable.
      }
    };

    void loadLatestRelease();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === 'accepted') {
      setInstallEvent(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-surface-light dark:from-background-dark dark:to-surface-dark transition-colors">
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-9">
          <h1 className="text-3xl md:text-[2.1rem] font-bold text-slate-900 dark:text-slate-50 mb-3">
            Get CampusCart
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto leading-7">
            Install the web app instantly on Android from Chrome. APK is available as a fallback.
          </p>

          {/* Android Download Card */}
          <div
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 md:p-7 mb-7 border-2 ${
              isAndroid
                ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900'
                : 'border-slate-200 dark:border-slate-700'
            } transition-all`}
          >
            <div className="flex items-center justify-center mb-4">
              {/* Android Logo SVG */}
              <svg
                className="w-12 h-12 text-primary-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.6915026,16.4744748 L21.5044012,10.0151496 L21.5127816,10.0151496 C21.8013399,9.55925865 21.6604513,8.93283392 21.2045604,8.64416962 C20.7486695,8.35550532 20.1222448,8.49639397 19.8336864,8.95228495 L16.84,14.0151496 L13.6,14.0151496 L13.6,3.5 C13.6,2.671572 13.0128167,2 12.3,2 C11.5871833,2 11,2.671572 11,3.5 L11,14.0151496 L7.4,14.0151496 L4.16630635,8.95228495 C3.87746007,8.49639397 3.2510354,8.35550532 2.79514457,8.64416962 C2.33925373,8.93283392 2.19836507,9.55925865 2.48721135,10.0151496 L2.4956,10.0151496 L6.3084974,16.4744748 C6.65840734,17.0544595 7.31412392,17.4 8.06,17.4 L15.94,17.4 C16.6858761,17.4 17.3416093,17.0544595 17.6915026,16.4744748 Z" />
              </svg>
            </div>

            <h2 className="text-[1.35rem] font-bold text-slate-900 dark:text-slate-50 mb-2">
              Android
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Version {latestReleaseVersion}
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 mb-4 text-left">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                Recommended: Install as Web App (PWA)
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Fast install, home screen icon, full-screen app experience, and auto updates.
              </p>
            </div>

            {isInstalled ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 mb-4">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  CampusCart is already installed on this device.
                </p>
              </div>
            ) : null}

            {!isInstalled && installEvent ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className={`w-full px-5 py-2.5 rounded-xl font-semibold transition-all mb-3 text-sm ${
                  isAndroid
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Install CampusCart App
              </button>
            ) : null}

            {/* APK fallback notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Fallback:</strong> If install is unavailable on your browser, use the APK build instead.
              </p>
              {!isInstalled && !installEvent && isAndroid ? (
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                  Tip: In Chrome, tap the menu and choose &quot;Install app&quot; or &quot;Add to Home screen&quot; first.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <a
                href={latestApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-5 py-2.5 rounded-xl font-semibold transition-all bg-primary-500 text-white hover:bg-primary-600 text-sm"
              >
                Download Latest APK (GitHub)
              </a>

              <a
                href={mobileReleasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-5 py-2.5 rounded-xl font-semibold transition-all bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm"
              >
                View Mobile Releases (GitHub)
              </a>

              <a
                href={latestReleaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-5 py-2.5 rounded-xl font-semibold transition-all bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm"
              >
                Open Current GitHub Release
              </a>

              <a
                href={mobileRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-5 py-2.5 rounded-xl font-semibold transition-all bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm"
              >
                Open Mobile Repository
              </a>

              {/* Local APK Path for Development */}
              <details className="text-left">
                <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium">
                  Developer: GitHub Release Workflow
                </summary>
                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-900 rounded text-sm text-slate-700 dark:text-slate-300 font-mono">
                  <p className="mb-2">Upload APK to the mobile repo Releases page:</p>
                  <code className="block bg-slate-800 text-slate-100 p-2 rounded mb-2 overflow-x-auto">
                    {mobileReleasesUrl}
                  </code>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Suggested asset name for auto-download link: <code className="bg-slate-800 text-slate-100 px-1">campuscart.apk</code>
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
        <section className="grid md:grid-cols-3 gap-5 my-14">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-md">
            <div className="text-2xl mb-2.5">📱</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Mobile First
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Browse, message, and manage listings from anywhere on campus
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-md">
            <div className="text-2xl mb-2.5">🔒</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Student Verified
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Buy and sell with confidence in your campus community
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-md">
            <div className="text-2xl mb-2.5">⚡</div>
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
