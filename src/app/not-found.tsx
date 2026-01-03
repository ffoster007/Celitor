// app/not-found.tsx
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-gradient-to-b from-transparent to-zinc-50/60 dark:to-zinc-900/40">
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl ring-1 ring-zinc-200/60 bg-white/70 backdrop-blur dark:bg-zinc-900/60 dark:ring-zinc-700/50">
          <Image
            src="/assets/Calitors.png"
            alt="AVACX"
            width={72}
            height={72}
            priority
            className="rounded-md shadow-sm"
          />
        </div>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Page not found (404)
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-300">
          Sorry — we couldn’t find the page you’re looking for. It may have been moved, deleted, or the URL may be incorrect.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            aria-label="Go back home"
          >
            <span>Go back home</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M4.5 12a.75.75 0 0 1 .75-.75h11.69l-3.72-3.72a.75.75 0 1 1 1.06-1.06l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06l3.72-3.72H5.25A.75.75 0 0 1 4.5 12Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-white hover:text-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}