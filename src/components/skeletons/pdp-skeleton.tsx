import Skeleton from "../ui/skeleton";

export default function PDPSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
      <div className="basis-full lg:basis-4/6">
        <Skeleton className="aspect-square h-full max-h-[550px] w-full rounded-2xl" />
      </div>
      <div className="mt-6 basis-full space-y-4 lg:mt-0 lg:basis-2/6">
        <Skeleton className="h-10 w-4/5 rounded-full" />
        <Skeleton className="h-6 w-1/4 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-5/6 rounded-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
