import { ListRowSkeleton, PageFrame, SkeletonBlock } from "@/components/LoadingSkeletons";

export default function MyListingsLoading() {
  return (
    <PageFrame>
      <div className="mb-8 rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 dark:border-white/10 dark:bg-white/5">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-3 h-10 w-56" />
        <SkeletonBlock className="mt-2 h-4 w-36" />
      </div>
      <ListRowSkeleton count={5} />
    </PageFrame>
  );
}
