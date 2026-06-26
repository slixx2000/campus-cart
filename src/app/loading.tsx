import {
  PageFrame,
  ProductGridSkeleton,
  SectionHeaderSkeleton,
  SkeletonBlock,
} from "@/components/LoadingSkeletons";

export default function AppLoading() {
  return (
    <PageFrame>
      <div className="mb-8 rounded-[2rem] border border-slate-200/70 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-4 h-10 w-3/4" />
        <SkeletonBlock className="mt-3 h-4 w-2/3" />
      </div>

      <SectionHeaderSkeleton />
      <ProductGridSkeleton count={8} />
    </PageFrame>
  );
}
