"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-base-content/70 mb-4">
              {error.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => reset()} className="btn btn-primary">
                Try again
              </button>
              <Link href="/" className="btn btn-ghost">
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}