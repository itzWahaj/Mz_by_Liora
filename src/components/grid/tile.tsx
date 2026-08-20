import clsx from "clsx";
import Image from "next/image";
import Label from "../label";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: "bottom" | "center";
  };
} & React.ComponentProps<typeof Image>) {
  const { alt: imageAlt, fill, ...imageProps } = props;
  const alt = typeof imageAlt === "string" ? imageAlt : "";

  return (
    <div
      className={clsx(
        "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border bg-neutral-100 transition-brand hover:border-brand-teal dark:bg-black",
        {
          "border-2 border-brand-teal": active,
          "border-neutral-200 dark:border-neutral-800": !active,
        }
      )}
    >
      {props.src ? (
        <Image
          className={clsx(
            fill ? "object-cover" : "relative h-full w-full object-contain",
            {
              "transition duration-[400ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100":
                isInteractive,
            }
          )}
          alt={alt}
          fill={fill}
          {...imageProps}
        />
      ) : null}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
