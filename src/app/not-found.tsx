import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        The page you are looking for does not exist or is unavailable.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-brand hover:brightness-110"
      >
        Back to home
      </Link>
    </div>
  );
}
