import { MessageShellSkeleton, PageFrame, SkeletonBlock } from "@/components/LoadingSkeletons";

export default function MessagesLoading() {
  return (
    <PageFrame>
      <SkeletonBlock className="mb-6 h-8 w-40" />
      <MessageShellSkeleton />
    </PageFrame>
  );
}
