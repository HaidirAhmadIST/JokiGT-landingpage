'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
          <button
            onClick={() => reset()}
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
