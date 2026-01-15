import { birthstone, delius, cherryBomb, sans } from "./fonts";

const people = [
  { id: "eben", label: "Eben Copple" },
  { id: "steph", label: "Stephanie Berry" },
  { id: "lindy", label: "Lindy McKinnon" },
  { id: "michael", label: "Michael Berry" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl flex flex-col gap-6 items-center">
        {/* Title */}
        <h1
          className={`${birthstone.className} text-4xl md:text-5xl text-black`}
        >
          Q&amp;A System
        </h1>

        {/* Instruction */}
        <p
          className={`${delius.className} text-xl md:text-2xl text-center text-black`}
        >
          Please begin by selecting your name
          <br />
          from the list below
        </p>

        {/* Name buttons */}
        <div className="w-full flex flex-col gap-4 mt-4">
          {people.map((p) => (
            <a
              key={p.id}
              href={`/${p.id}`}
              className={`
                ${cherryBomb.className}
                block w-full text-center text-xl md:text-2xl text-black
                border-2 border-black rounded-full
                px-6 py-4
                hover:bg-black hover:text-white
                transition-colors
              `}
            >
              {p.label}
            </a>
          ))}
        </div>

        {/* Version / Admin link */}
        <a href="/admin" className="group mt-6">
          <span
            className={`${sans.className} italic text-base text-black transition-colors group-hover:text-gray-600`}
          >
            Version 2.0 – Updated 1/15/2026
          </span>
        </a>
      </div>
    </main>
  );
}
