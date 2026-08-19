import { PageFrame, SkeletonBlock } from "@/components/LoadingSkeletons";

export default function SellLoading() {
  return (
    <PageFrame>
      {/* 4-node step progress */}
      <div className="mb-10 flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <SkeletonBlock className="size-7 rounded-full" variant="form" delayMs={i * 60} />
            <SkeletonBlock className="hidden h-3 w-16 sm:block" variant="form" delayMs={i * 60 + 30} />
            {i < 3 ? <SkeletonBlock className="h-px flex-1" variant="form" /> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card space-y-6 p-6">
            <SkeletonBlock className="h-6 w-40" variant="form" />
            <SkeletonBlock className="h-52 w-full rounded-lg" variant="form" delayMs={90} />
            <SkeletonBlock className="h-12 w-full" variant="form" delayMs={180} />
            <div className="flex justify-between pt-4">
              <SkeletonBlock className="h-11 w-24 rounded-md" variant="form" delayMs={240} />
              <SkeletonBlock className="h-11 w-36 rounded-md" variant="form" delayMs={280} />
            </div>
          </div>
        </div>

        {/* live preview rail */}
        <aside className="space-y-3">
          <SkeletonBlock className="h-5 w-32" variant="form" />
          <SkeletonBlock className="h-4 w-48" variant="form" delayMs={60} />
          <div className="card overflow-hidden">
            <SkeletonBlock className="aspect-square rounded-none" variant="form" delayMs={120} />
            <div className="space-y-2 p-3">
              <SkeletonBlock className="h-5 w-1/3" variant="form" delayMs={160} />
              <SkeletonBlock className="h-4 w-3/4" variant="form" delayMs={200} />
              <SkeletonBlock className="h-3 w-1/2" variant="form" delayMs={240} />
            </div>
          </div>
        </aside>
      </div>
    </PageFrame>
  );
}
