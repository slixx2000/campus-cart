import {
  PageFrame,
  ProductGridSkeleton,
  SkeletonBlock,
} from "@/components/LoadingSkeletons";

export default function ProductLoading() {
  return (
    <PageFrame>
      {/* breadcrumbs */}
      <SkeletonBlock className="mb-6 h-4 w-72" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* gallery + thumbnail row */}
        <div className="space-y-4 lg:col-span-7">
          <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock
                key={i}
                className="size-20 rounded-lg"
                delayMs={i * 60}
              />
            ))}
          </div>
        </div>

        {/* info rail: title, price, chips, actions, seller card */}
        <div className="space-y-5 lg:col-span-5">
          <div className="card space-y-4 p-6">
            <SkeletonBlock className="h-8 w-4/5" />
            <SkeletonBlock className="h-10 w-40" delayMs={80} />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-6 w-24 rounded-md" delayMs={140} />
              <SkeletonBlock className="h-6 w-32 rounded-md" delayMs={180} />
              <SkeletonBlock className="h-6 w-28 rounded-md" delayMs={220} />
            </div>
            <SkeletonBlock className="h-4 w-44" delayMs={260} />
            <div className="space-y-3 pt-2">
              <SkeletonBlock className="h-11 w-full rounded-md" delayMs={300} />
              <SkeletonBlock className="h-11 w-full rounded-md" delayMs={340} />
            </div>
          </div>
          <SkeletonBlock className="h-40 w-full rounded-lg" delayMs={380} />
        </div>
      </div>

      {/* description */}
      <SkeletonBlock className="mt-10 h-40 w-full rounded-lg" />

      <div className="mt-14">
        <SkeletonBlock className="mb-6 h-8 w-56" />
        <ProductGridSkeleton count={4} />
      </div>
    </PageFrame>
  );
}
