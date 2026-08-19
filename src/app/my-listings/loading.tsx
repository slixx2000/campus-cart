import { ListRowSkeleton, PageFrame, SkeletonBlock } from "@/components/LoadingSkeletons";

export default function MyListingsLoading() {
  return (
    <PageFrame>
      <div className="card mb-8 p-6">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-3 h-10 w-56" />
        <SkeletonBlock className="mt-2 h-4 w-36" />
      </div>
      <ListRowSkeleton count={5} />
    </PageFrame>
  );
}
