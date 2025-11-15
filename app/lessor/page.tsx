import Navbar from "@/components/navbar";

export default function LessorPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-blue-50">
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-500/30">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Lessor Services
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600">
            Manage your properties and connect with potential tenants.
          </p>
        </div>
      </main>
    </div>
  );
}
