import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="mt-4 h-9 w-72 max-w-full" />
      <div className="mt-6 flex gap-2">
        <SkeletonBlock className="h-9 w-44" />
        <SkeletonBlock className="h-9 w-52" />
        <SkeletonBlock className="h-9 w-36" />
      </div>
      <SkeletonBlock className="mt-8 h-96" />
    </div>
  );
}
