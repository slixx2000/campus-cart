import type { CSSProperties, ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function SkeletonBlock({
  className,
  variant = "grid",
  delayMs,
}: {
  className: string;
  variant?: "grid" | "chat" | "form";
  delayMs?: number;
}) {
  const style: CSSProperties | undefined = delayMs
    ? { animationDelay: `${delayMs}ms` }
    : undefined;

  return (
    <div
      className={cx(
        "skeleton-base rounded-xl",
        variant === "chat" && "skeleton-chat",
        variant === "form" && "skeleton-form",
        variant === "grid" && "skeleton-grid",
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background-light text-slate-900 dark:bg-[#07111f] dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
      <SkeletonBlock className="aspect-square rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-4 w-3/4" delayMs={80} />
        <SkeletonBlock className="h-4 w-1/3" delayMs={160} />
        <SkeletonBlock className="h-3 w-1/2" delayMs={240} />
        <div className="flex items-center gap-2 pt-2">
          <SkeletonBlock className="size-8 rounded-full" delayMs={320} />
          <SkeletonBlock className="h-3 w-1/3" delayMs={400} />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="mb-4 flex items-center justify-between">
      <SkeletonBlock className="h-7 w-56" />
      <SkeletonBlock className="h-4 w-20" />
    </div>
  );
}

export function MessageShellSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      <aside className="hidden w-80 shrink-0 rounded-2xl border border-slate-200 bg-white/70 p-4 md:block dark:border-slate-800 dark:bg-slate-900/70">
        <SkeletonBlock className="mb-4 h-6 w-28" variant="chat" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-2">
              <SkeletonBlock className="size-10 rounded-full" variant="chat" delayMs={i * 70} />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-2/3" variant="chat" delayMs={i * 70 + 40} />
                <SkeletonBlock className="h-3 w-full" variant="chat" delayMs={i * 70 + 80} />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <SkeletonBlock className="size-12 rounded-full" variant="chat" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-36" variant="chat" delayMs={60} />
            <SkeletonBlock className="h-3 w-56" variant="chat" delayMs={120} />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock
              key={i}
              className={cx("h-14", i % 2 ? "w-4/5" : "w-2/3")}
              variant="chat"
              delayMs={i * 60}
            />
          ))}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <SkeletonBlock className="h-11 w-full rounded-2xl" variant="chat" delayMs={200} />
        </div>
      </section>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-6 dark:border-white/10 dark:bg-white/5 md:p-10">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
        <SkeletonBlock className="size-32 rounded-full md:size-40" />
        <div className="w-full flex-1 space-y-3">
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-4 w-44" />
          <div className="flex gap-6 pt-2">
            <SkeletonBlock className="h-10 w-20" />
            <SkeletonBlock className="h-10 w-20" />
          </div>
          <div className="flex gap-3 pt-2">
            <SkeletonBlock className="h-10 w-36" />
            <SkeletonBlock className="h-10 w-44" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200/70 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5"
        >
          <SkeletonBlock className="size-20 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/5" />
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
          <div className="hidden gap-2 sm:flex">
            <SkeletonBlock className="h-9 w-16 rounded-full" />
            <SkeletonBlock className="h-9 w-16 rounded-full" />
            <SkeletonBlock className="h-9 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 dark:border-white/10 dark:bg-white/5">
      <div className="space-y-4">
        <SkeletonBlock className="h-4 w-36" variant="form" />
        <SkeletonBlock className="h-8 w-72" variant="form" delayMs={90} />
        <SkeletonBlock className="h-4 w-full" variant="form" delayMs={180} />
      </div>
      <div className="mt-8 space-y-4">
        <SkeletonBlock className="h-12 w-full" variant="form" delayMs={240} />
        <SkeletonBlock className="h-12 w-full" variant="form" delayMs={320} />
        <SkeletonBlock className="h-40 w-full rounded-2xl" variant="form" delayMs={400} />
        <div className="flex justify-end">
          <SkeletonBlock className="h-11 w-36 rounded-full" variant="form" delayMs={480} />
        </div>
      </div>
    </div>
  );
}
