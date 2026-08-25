"use client";

import { CustomerOrder } from "@/lib/customer/types";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingBagIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

export default function OrdersList({ orders }: { orders: CustomerOrder[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#D8BB7A]/40 bg-[#FFFDF8] p-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#596522]/10 text-[#596522]">
          <ShoppingBagIcon className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-[#4D581E]">
          No orders yet
        </h3>
        <p className="mt-2 max-w-md text-sm text-[#303515]/70">
          When you place your first order for our botanical skincare rituals, your purchase details and tracking will appear here.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#596522] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#C49A45] hover:shadow-lg"
        >
          <span>Explore Rituals</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const orderDate = new Date(order.processedAt).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        );

        const isPaid =
          order.financialStatus === "PAID" ||
          order.financialStatus === "AUTHORIZED";
        const isFulfilled = order.fulfillmentStatus === "FULFILLED";

        return (
          <div
            key={order.id}
            className="overflow-hidden rounded-3xl border border-[#D8BB7A]/50 bg-[#FFFDF8] p-6 shadow-sm transition-all duration-300 hover:border-[#C49A45] hover:shadow-md"
          >
            {/* Order Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8BB7A]/30 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-display text-lg font-bold text-[#4D581E]">
                    Order {order.name || `#${order.number}`}
                  </h4>
                  <span className="text-xs text-[#303515]/60">• {orderDate}</span>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                {/* Financial Status */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    isPaid
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {isPaid ? (
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ClockIcon className="h-3.5 w-3.5" />
                  )}
                  {order.financialStatus}
                </span>

                {/* Fulfillment Status */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    isFulfilled
                      ? "bg-[#596522]/10 text-[#596522] border border-[#596522]/30"
                      : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                  }`}
                >
                  <TruckIcon className="h-3.5 w-3.5" />
                  {order.fulfillmentStatus || "UNFULFILLED"}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="divide-y divide-[#D8BB7A]/20 py-4">
              {order.lineItems?.nodes?.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 flex-none overflow-hidden rounded-2xl border border-[#D8BB7A]/40 bg-[#FAF9F4]">
                      {item.image?.url ? (
                        <Image
                          src={item.image.url}
                          alt={item.image.altText || item.title}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src="/new_logo.png"
                          alt="MZ by LIORA"
                          width={48}
                          height={48}
                          className="h-full w-full object-contain p-2 opacity-70"
                        />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-[#303515]">
                        {item.title}
                      </h5>
                      <p className="text-xs text-[#303515]/60">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#4D581E]">
                      {item.totalPrice
                        ? formatPrice(item.totalPrice.amount, item.totalPrice.currencyCode)
                        : item.price
                        ? formatPrice(item.price.amount, item.price.currencyCode)
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total Footer */}
            <div className="flex items-center justify-between border-t border-[#D8BB7A]/30 pt-4">
              <span className="text-xs text-[#303515]/70">
                {order.lineItems?.nodes?.length || 0} item(s)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-wider text-[#303515]/60">
                  Total
                </span>
                <span className="font-display text-lg font-bold text-[#596522]">
                  {formatPrice(
                    order.totalPrice.amount,
                    order.totalPrice.currencyCode
                  )}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
