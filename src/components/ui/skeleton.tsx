import clsx from "clsx";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "skeleton-shimmer rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70",
        className
      )}
    />
  );
}
