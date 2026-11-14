import Link from "next/link";

// Demo launcher: one door for candidates, one for recruiters.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-12">
      <div className="text-center">
        <p className="text-5xl" aria-hidden>🧭</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">SkillScan</h1>
        <p className="mt-2 text-slate-600">Show your skills, not your CV.</p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href="/demo/kirkas"
          target="_blank"
          rel="noopener"
          className="tap flex min-h-20 items-center gap-4 rounded-3xl bg-brand-700 px-5 text-white shadow-md shadow-brand-700/20 active:scale-[0.99]"
        >
          <span className="text-3xl" aria-hidden>🙋</span>
          <span className="flex-1">
            <span className="block text-lg font-bold">I&apos;m a candidate</span>
            <span className="block text-sm text-white/80">Opens a fresh booth QR link, as if scanned</span>
          </span>
          <span className="text-xl text-white/70" aria-hidden>↗</span>
        </a>

        <Link
          href="/r"
          className="tap flex min-h-20 items-center gap-4 rounded-3xl bg-white px-5 shadow-sm ring-1 ring-slate-200 active:scale-[0.99]"
        >
          <span className="text-3xl" aria-hidden>🧑‍💼</span>
          <span className="flex-1">
            <span className="block text-lg font-bold">I&apos;m a recruiter</span>
            <span className="block text-sm text-slate-500">Enter your company PIN</span>
          </span>
          <span className="text-xl text-slate-300" aria-hidden>›</span>
        </Link>
      </div>

      <p className="text-center text-xs text-slate-500">Demo with synthetic data only. No CVs, no contact data, no scores.</p>
    </main>
  );
}
