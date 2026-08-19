import {
  PageFrame,
  ProductGridSkeleton,
  SectionHeaderSkeleton,
  SkeletonBlock,
} from "@/components/LoadingSkeletons";

export default function AppLoading() {
  return (
    <PageFrame>
      {/* Hero: centred headline + sub + search + two CTAs, matching page.tsx */}
      <div className="flex flex-col items-center gap-6 py-12 text-center md:py-20">
        <SkeletonBlock className="h-12 w-full max-w-xl" />
        <SkeletonBlock className="h-5 w-full max-w-md" delayMs={80} />
        <SkeletonBlock className="h-11 w-full max-w-xl rounded-md" delayMs={160} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <SkeletonBlock className="h-11 w-44 rounded-md" delayMs={240} />
          <SkeletonBlock className="h-11 w-36 rounded-md" delayMs={280} />
        </div>
      </div>

      <SkeletonBlock className="mb-6 h-8 w-56" />
      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24 rounded-lg" delayMs={i * 40} />
        ))}
      </div>

      <SectionHeaderSkeleton />
      <ProductGridSkeleton count={8} />
    </PageFrame>
  );
}
