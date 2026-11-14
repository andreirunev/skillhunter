import Link from "next/link";

// Demo launcher: one door for candidates, one for recruiters.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-4 py-12">
      <div className="mb-3">
        <h1 className="text-3xl font-bold tracking-tight">SkillScan</h1>
        <p className="mt-1 text-slate-600">Show your skills, not your CV.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/join"
          className="tap flex min-h-16 items-center gap-3 border border-slate-900 bg-slate-900 px-4 text-white active:bg-slate-700"
        >
          <span className="flex-1">
            <span className="block text-lg font-bold">I&apos;m a candidate</span>
            <span className="block text-sm text-white/80">Enter the code from the booth</span>
          </span>
          <span className="text-xl text-white/70" aria-hidden>›</span>
        </Link>

        <Link
          href="/r"
          className="tap flex min-h-16 items-center gap-3 border border-slate-400 bg-white px-4 active:bg-slate-100"
        >
          <span className="flex-1">
            <span className="block text-lg font-bold">I&apos;m a recruiter</span>
            <span className="block text-sm text-slate-500">Enter your company PIN</span>
          </span>
          <span className="text-xl text-slate-400" aria-hidden>›</span>
        </Link>
      </div>

      <p className="mt-3 text-xs text-slate-500">Demo with synthetic data only. No CVs, no contact data, no scores.</p>
    </main>
  );
}
