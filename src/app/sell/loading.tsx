import { FormCardSkeleton, PageFrame } from "@/components/LoadingSkeletons";

export default function SellLoading() {
  return (
    <PageFrame>
      <div className="mx-auto max-w-4xl">
        <FormCardSkeleton />
      </div>
    </PageFrame>
  );
}
