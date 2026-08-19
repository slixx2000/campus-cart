import {
  PageFrame,
  ProductGridSkeleton,
  SkeletonBlock,
} from "@/components/LoadingSkeletons";

export default function BrowseLoading() {
  return (
    <PageFrame>
      <div className="flex flex-col gap-5 md:flex-row md:gap-8">
        {/* Filter sidebar — desktop only, matching BrowseFilters */}
        <aside className="hidden w-full md:block md:w-72">
          <div className="card space-y-6 p-5">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-5 w-20" />
              <SkeletonBlock className="h-4 w-16" />
            </div>
            <SkeletonBlock className="h-11 w-full rounded-md" delayMs={60} />
            {/* category / price / condition / university / type groups */}
            {Array.from({ length: 5 }).map((_, group) => (
              <div key={group} className="space-y-3">
                <SkeletonBlock className="h-3 w-24" delayMs={group * 80} />
                {Array.from({ length: 3 }).map((_, row) => (
                  <SkeletonBlock
                    key={row}
                    className="h-4 w-2/3"
                    delayMs={group * 80 + row * 30}
                  />
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          {/* "Showing N results" + sort select */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SkeletonBlock className="h-8 w-56" />
            <SkeletonBlock className="h-10 w-40 rounded-md" delayMs={60} />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </PageFrame>
  );
}
