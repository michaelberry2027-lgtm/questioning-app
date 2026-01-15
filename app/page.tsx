export default function Home() {
  const people = ["eben", "steph", "lindy", "michael"];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Who are you?</h1>

      <div className="flex flex-col gap-3">
        {people.map((p) => (
          <a
            key={p}
            href={`/${p}`}
            className="rounded-xl bg-black text-white px-4 py-3 text-lg text-center"
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </a>
        ))}
      </div>
    </main>
  );
}
