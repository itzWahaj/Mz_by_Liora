import clsx from "clsx";
import PriceDisplay from "./price-display";

export default function Label({
  title,
  amount,
  compareAtAmount,
  currencyCode,
  position = "bottom",
}: {
  title: string;
  amount: string;
  compareAtAmount?: string | null;
  currencyCode: string;
  position?: "bottom" | "center";
}) {
  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 flex w-full px-4 pb-4 srccontainer/label",
        {
          "lg:px-20 lg:pb-[35%]": position === "center",
        }
      )}
    >
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        <h3 className="mr-4 line-clamp-2 flex-grow pl-2 leading-none tracking-tight">
          {title}
        </h3>
        <div className="flex-none rounded-full bg-brand px-3 py-1.5 text-white">
          <PriceDisplay
            amount={amount}
            compareAtAmount={compareAtAmount}
            currencyCode={currencyCode}
            size="xs"
            priceClassName="text-white"
            compareAtClassName="text-white/70"
            badgeClassName="bg-white text-brand-coral"
            currencyCodeClassName="hidden src[275px]/label:inline"
          />
        </div>
      </div>
    </div>
  );
}
