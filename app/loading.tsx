export default function GlobalLoading() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="animate-pulse rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="mt-4 h-8 w-72 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-full rounded bg-gray-200" />
        <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-2xl bg-gray-200" />
          <div className="h-28 rounded-2xl bg-gray-200" />
          <div className="h-28 rounded-2xl bg-gray-200" />
        </div>
      </div>
    </section>
  );
}
