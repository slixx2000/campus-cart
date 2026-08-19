import { PageFrame, ProfileHeaderSkeleton, SkeletonBlock } from "@/components/LoadingSkeletons";

export default function ProfileByIdLoading() {
  return (
    <PageFrame>
      <ProfileHeaderSkeleton />
      <div className="mt-8 rounded-lg border border-line bg-surface p-6 dark:bg-surface">
        <SkeletonBlock className="h-10 w-72" />
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
