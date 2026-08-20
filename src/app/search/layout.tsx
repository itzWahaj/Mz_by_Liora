import Collections from "@/components/layout/search/collections";
import FilterList from "@/components/layout/search/filter";
import { sorting } from "@/lib/constants";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 pb-10 pt-2 text-black md:flex-row md:gap-8 md:px-6 dark:text-white">
      <aside className="order-first w-full flex-none md:sticky md:top-24 md:max-w-[220px] md:self-start">
        <Collections />
      </aside>

      <div className="order-last min-h-screen w-full md:order-none">
        {children}
      </div>

      <aside className="order-none w-full flex-none md:sticky md:top-24 md:order-last md:w-[220px] md:self-start">
        <FilterList list={sorting} title="Sort by" />
      </aside>
    </div>
  );
}
