"use client";

import NoConnectionState from "@/components/NoConnectionState";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const message = error.message.toLowerCase();
  const looksLikeConnectionIssue =
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("offline") ||
    message.includes("connection");

  if (looksLikeConnectionIssue) {
    return <NoConnectionState onRetry={reset} />;
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-300/20 dark:bg-red-300/10">
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-200">Something went wrong</h1>
        <p className="mt-3 text-sm text-red-600 dark:text-red-100">
          We hit an unexpected issue. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    </section>
  );
}
