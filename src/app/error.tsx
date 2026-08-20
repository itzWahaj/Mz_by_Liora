"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 dark:border-neutral-800 dark:bg-black">
      <h2 className="font-display text-xl font-bold">Something went wrong</h2>
      <p className="my-2 text-neutral-600 dark:text-neutral-400">
        There was an issue with our storefront. This could be a temporary issue,
        please try your action again.
      </p>
      <button
        className="mx-auto mt-4 flex w-full items-center justify-center btn-brand-lg"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
}
