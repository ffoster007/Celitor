// app/not-found.tsx
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-gradient-to-b from-black to-gray-900/40">
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl ring-1 ring-gray-700/50 bg-gray-900/60 backdrop-blur">
          <Image
            src="/assets/Calitors.png"
            alt="AVACX"
            width={72}
            height={72}
            priority
            className="rounded-md shadow-sm"
          />
        </div>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl text-white">
          Page not found (404)
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-300">
          Sorry — we couldn’t find the page you’re looking for. It may have been moved, deleted, or the URL may be incorrect.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-black shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
            href="/content"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-gray-200 ring-1 ring-inset ring-gray-700 hover:bg-gray-800 hover:text-white"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}