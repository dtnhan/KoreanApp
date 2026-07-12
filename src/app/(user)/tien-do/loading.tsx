import { SkeletonBlock, ListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <SkeletonBlock className="h-9 w-64" />
      <SkeletonBlock className="mt-3 h-5 w-80 max-w-full" />
      <div className="mt-8">
        <ListSkeleton rows={6} />
      </div>
    </div>
  );
}
