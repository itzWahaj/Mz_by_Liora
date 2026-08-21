import Skeleton from "../ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/70 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/70">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  );
}
