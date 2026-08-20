import clsx from "clsx";
import Image from "next/image";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  const px = size === "sm" ? 36 : 48;

  return (
    <div
      className={clsx(
        "relative flex flex-none items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_0_0_1px_rgba(30,95,191,0.12)]",
        {
          "h-12 w-12": !size,
          "h-9 w-9": size === "sm",
        }
      )}
    >
      <Image
        src="/logo.png"
        alt="MZ by LIORA"
        width={px}
        height={px}
        className="h-full w-full object-contain p-0.5"
        priority
      />
    </div>
  );
}
