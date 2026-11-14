import { listCompanies } from "@/lib/db";

export const dynamic = "force-dynamic";

// Placeholder: proves the app reads the seeded companies from Postgres.
export default async function Home() {
  const companies = await listCompanies();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">SkillScan</h1>
      <p className="mt-2 text-zinc-500">Setup check: companies loaded from Postgres.</p>
      <ul className="mt-6 space-y-3">
        {companies.map((c) => (
          <li key={c.slug} className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4">
            <span className="h-10 w-10 shrink-0 rounded-xl" style={{ background: c.color }} />
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-zinc-500">{c.sector} · booth {c.booth} · {c.test_title}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
