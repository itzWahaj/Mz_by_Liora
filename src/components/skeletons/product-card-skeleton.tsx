import Skeleton from "../ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-4/5 rounded-full" />
        <Skeleton className="h-3 w-2/5 rounded-full" />
      </div>
    </div>
  );
}
