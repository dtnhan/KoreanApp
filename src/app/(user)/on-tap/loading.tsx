import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="mt-3 h-4 w-48" />
      <SkeletonBlock className="mt-6 h-72" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}
