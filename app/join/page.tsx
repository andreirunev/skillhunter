import Link from "next/link";
import { checkCode } from "@/lib/data";
import { normalizeCode } from "@/lib/codes";
import { deviceHash } from "@/lib/device";
import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

const USED = "This code was already used or has expired. Ask the booth for a new one.";
const MISSING = "Code not found. Check the letters and digits.";

// Entering a code (POST /api/join) burns it. Coming back here with ?code=...
// only reports "used/expired" or "not found": never which company or candidate.
export default async function JoinPage(props: PageProps<"/join">) {
  const { code: raw } = await props.searchParams;
  const typed = typeof raw === "string" ? normalizeCode(raw.slice(0, 20)) : null;
  const check = typed !== null ? await checkCode(typed, await deviceHash()) : null;
  const error = check === "missing" ? MISSING : check === "used" || check === "mine" ? USED : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <Link href="/" className="inline-flex min-h-10 items-center self-start text-sm font-semibold text-brand-700">← Back</Link>
      <div>
        <p className="text-4xl" aria-hidden>🎟️</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Enter your booth code</h1>
        <p className="mt-1 text-slate-600">It is printed on the card you got at the booth. No name, no CV needed.</p>
      </div>
      <JoinForm initialCode={typed ?? ""} error={error} />
      {check === "mine" && typed && (
        <Link href={`/c/${typed}`} className="tap -mt-2 flex min-h-12 items-center justify-center rounded-2xl bg-white font-semibold text-brand-800 ring-1 ring-brand-600/30">
          You started this test on this phone: continue →
        </Link>
      )}
    </main>
  );
}
