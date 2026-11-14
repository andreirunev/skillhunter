import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Step 0 placeholder: proves the database is created and seeded on boot.
export default function Home() {
  const companies = getDb()
    .prepare("SELECT c.slug, c.name, c.sector, c.booth, c.color, t.title FROM companies c JOIN tests t ON t.company_id = c.id ORDER BY c.id")
    .all() as { slug: string; name: string; sector: string; booth: string; color: string; title: string }[];

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">SkillScan</h1>
      <p className="mt-2 text-zinc-500">Setup check: database seeded on boot.</p>
      <ul className="mt-6 space-y-3">
        {companies.map((c) => (
          <li key={c.slug} className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4">
            <span className="h-10 w-10 shrink-0 rounded-xl" style={{ background: c.color }} />
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-zinc-500">{c.sector} · booth {c.booth} · {c.title}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
