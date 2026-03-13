import { FormCardSkeleton, PageFrame } from "@/components/LoadingSkeletons";

export default function EditListingLoading() {
  return (
    <PageFrame>
      <div className="mx-auto max-w-3xl">
        <FormCardSkeleton />
      </div>
    </PageFrame>
  );
}
