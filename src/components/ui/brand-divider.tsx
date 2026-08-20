export default function BrandDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-brand-coral" />
      <span className="h-[2px] w-full bg-brand-gradient-full" />
    </div>
  );
}
