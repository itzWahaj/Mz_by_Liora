"use client";
import { CartItem } from "@/lib/shopify/types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormState } from "react-dom";
import { removeItem } from "./actions";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CartItem;
  optimisticUpdate: any;
}) {
  const [message, formAction] = useFormState(removeItem, null);
  const merchandiseId = item.merchandise.id;
  const actionWithVariant = formAction.bind(null, merchandiseId);

  return (
    <form
      action={async () => {
        optimisticUpdate(merchandiseId, "delete");
        await actionWithVariant();
      }}
    >
      <button
        type="submit"
        aria-label="Remove cart item"
        className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#596522] shadow-sm transition-brand hover:scale-110 hover:bg-[#C49A45] hover:shadow-[0_6px_16px_rgba(196,154,69,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A45]/50"
      >
        <XMarkIcon className="mx-[1px] h-4 w-4 text-white" />
      </button>
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
