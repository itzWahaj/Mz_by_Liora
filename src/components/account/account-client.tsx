"use client";

import { useState } from "react";
import { CustomerOrder, CustomerProfile } from "@/lib/customer/types";
import OrdersList from "./orders-list";
import AddressBook from "./address-book";
import Link from "next/link";
import {
  ShoppingBagIcon,
  MapPinIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function AccountClient({
  profile,
  orders,
}: {
  profile: CustomerProfile;
  orders: CustomerOrder[];
}) {
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");

  const displayName =
    profile.displayName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Valued Customer";

  const email = profile.emailAddress?.emailAddress || "";
  const phone = profile.phoneNumber?.phoneNumber || "";
  const initials = (profile.firstName?.[0] || displayName[0] || "M").toUpperCase();

  const tabs = [
    {
      id: "orders" as const,
      label: "My Orders",
      count: orders.length,
      icon: ShoppingBagIcon,
    },
    {
      id: "addresses" as const,
      label: "Saved Addresses",
      count: profile.addresses?.nodes?.length || (profile.defaultAddress ? 1 : 0),
      icon: MapPinIcon,
    },
    {
      id: "profile" as const,
      label: "Account Details",
      icon: UserCircleIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F4] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Profile Summary Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[#D8BB7A]/60 bg-[#FFFDF8] p-6 sm:p-8 shadow-sm">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#D8BB7A]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#596522]/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Monogram Avatar */}
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#D8BB7A] bg-[#596522] text-white shadow-md">
                <span className="font-display text-2xl sm:text-3xl font-bold tracking-wider">
                  {initials}
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#C49A45] text-white shadow-xs">
                  <SparklesIcon className="h-3.5 w-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#4D581E]">
                    {displayName}
                  </h1>
                </div>
                {email && <p className="text-xs sm:text-sm text-[#303515]/70">{email}</p>}
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#596522]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#596522]">
                  MZ by LIORA Member
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/api/auth/logout"
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-full border border-[#D8BB7A]/60 bg-white px-5 py-2.5 text-xs font-semibold text-[#303515] shadow-xs transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Log Out</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-[#D8BB7A]/30 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-[#596522] text-white shadow-md"
                    : "bg-[#FFFDF8] text-[#303515] border border-[#D8BB7A]/40 hover:border-[#C49A45] hover:text-[#596522]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#596522]"}`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#596522]/10 text-[#596522]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "orders" && <OrdersList orders={orders} />}

          {activeTab === "addresses" && (
            <AddressBook
              defaultAddress={profile.defaultAddress}
              addresses={profile.addresses?.nodes}
            />
          )}

          {activeTab === "profile" && (
            <div className="rounded-3xl border border-[#D8BB7A]/50 bg-[#FFFDF8] p-6 sm:p-8 shadow-sm">
              <h3 className="font-display text-xl font-bold text-[#4D581E]">
                Personal Information
              </h3>
              <p className="text-xs text-[#303515]/60">
                Your customer profile managed securely by Shopify Customer Account.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4] p-4">
                  <span className="text-xs uppercase tracking-wider text-[#303515]/60">
                    Full Name
                  </span>
                  <p className="mt-1 font-semibold text-[#303515]">{displayName}</p>
                </div>

                <div className="rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4] p-4">
                  <span className="text-xs uppercase tracking-wider text-[#303515]/60">
                    Email Address
                  </span>
                  <p className="mt-1 font-semibold text-[#303515]">{email || "Not specified"}</p>
                </div>

                <div className="rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4] p-4">
                  <span className="text-xs uppercase tracking-wider text-[#303515]/60">
                    Phone Number
                  </span>
                  <p className="mt-1 font-semibold text-[#303515]">{phone || "Not specified"}</p>
                </div>

                <div className="rounded-2xl border border-[#D8BB7A]/30 bg-[#FAF9F4] p-4">
                  <span className="text-xs uppercase tracking-wider text-[#303515]/60">
                    Authentication
                  </span>
                  <p className="mt-1 font-semibold text-[#596522]">
                    Shopify Customer Account (OAuth 2.0 PKCE)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
