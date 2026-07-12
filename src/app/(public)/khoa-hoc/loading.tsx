import { SkeletonBlock, CardGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SkeletonBlock className="h-9 w-56" />
      <SkeletonBlock className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-10">
        <CardGridSkeleton />
      </div>
    </div>
  );
}
