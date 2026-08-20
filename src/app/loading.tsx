import ProductCardSkeleton from "@/components/skeletons/product-card-skeleton";

export default function LoadingAppPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-12">
      <div className="mb-8 h-8 w-64 rounded-full skeleton-shimmer" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
