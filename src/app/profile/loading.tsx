import { PageFrame, ProfileHeaderSkeleton, SkeletonBlock } from "@/components/LoadingSkeletons";

export default function ProfileLoading() {
  return (
    <PageFrame>
      <ProfileHeaderSkeleton />
      <div className="mt-8 rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-6 dark:border-white/10 dark:bg-white/5">
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
