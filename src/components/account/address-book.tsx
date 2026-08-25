"use client";

import { CustomerAddress } from "@/lib/customer/types";
import {
  MapPinIcon,
  CheckBadgeIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function AddressBook({
  defaultAddress,
  addresses,
}: {
  defaultAddress?: CustomerAddress;
  addresses?: CustomerAddress[];
}) {
  const allAddresses = addresses || (defaultAddress ? [defaultAddress] : []);

  if (!allAddresses || allAddresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#D8BB7A]/40 bg-[#FFFDF8] p-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#596522]/10 text-[#596522]">
          <MapPinIcon className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-[#4D581E]">
          No saved addresses
        </h3>
        <p className="mt-2 max-w-md text-sm text-[#303515]/70">
          Addresses saved during your purchases will be stored here for faster checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {allAddresses.map((addr, idx) => {
        const isDefault = defaultAddress?.id && defaultAddress.id === addr.id;

        return (
          <div
            key={addr.id || idx}
            className={`relative flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition-all duration-300 ${
              isDefault
                ? "border-[#596522] bg-[#FAF9F4] ring-1 ring-[#596522]/20"
                : "border-[#D8BB7A]/50 bg-[#FFFDF8] hover:border-[#C49A45]"
            }`}
          >
            <div>
              {/* Header / Badge */}
              <div className="flex items-center justify-between gap-2 pb-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-[#596522]" />
                  <span className="font-semibold text-sm text-[#4D581E]">
                    {addr.firstName || addr.lastName
                      ? `${addr.firstName || ""} ${addr.lastName || ""}`.trim()
                      : `Address #${idx + 1}`}
                  </span>
                </div>

                {isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#596522] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <CheckBadgeIcon className="h-3.5 w-3.5" />
                    Default
                  </span>
                )}
              </div>

              {/* Address details */}
              <div className="space-y-1 text-sm text-[#303515]/80">
                {addr.address1 && <p>{addr.address1}</p>}
                {addr.address2 && <p>{addr.address2}</p>}
                <p>
                  {[addr.city, addr.province, addr.zip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {addr.country && <p className="font-medium text-[#4D581E]">{addr.country}</p>}
              </div>

              {addr.phoneNumber && (
                <div className="mt-4 flex items-center gap-2 border-t border-[#D8BB7A]/30 pt-3 text-xs text-[#303515]/70">
                  <PhoneIcon className="h-3.5 w-3.5 text-[#C49A45]" />
                  <span>{addr.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
