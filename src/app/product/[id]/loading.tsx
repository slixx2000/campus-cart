import { PageFrame, ProductGridSkeleton, SkeletonBlock } from "@/components/LoadingSkeletons";

export default function ProductLoading() {
  return (
    <PageFrame>
      <SkeletonBlock className="mb-8 h-4 w-72" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <SkeletonBlock className="aspect-[4/3] w-full rounded-[2rem]" />
          <SkeletonBlock className="h-40 w-full rounded-[1.75rem]" />
        </div>
        <div className="space-y-5 lg:col-span-5">
          <SkeletonBlock className="h-[620px] w-full rounded-[2rem]" />
          <SkeletonBlock className="h-40 w-full rounded-[1.75rem]" />
        </div>
      </div>

      <SkeletonBlock className="mt-12 h-56 w-full max-w-4xl rounded-[2rem]" />

      <div className="mt-20">
        <SkeletonBlock className="mb-6 h-8 w-56" />
        <ProductGridSkeleton count={4} />
      </div>
    </PageFrame>
  );
}
