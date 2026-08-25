export default function BrandDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-[#C49A45] shadow-xs" />
      <span className="h-[2px] w-full bg-gradient-to-r from-[#D8BB7A] via-[#C49A45] to-transparent" />
    </div>
  );
}
