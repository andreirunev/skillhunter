import Link from "next/link";
import { redirect } from "next/navigation";
import { checkCode } from "@/lib/data";
import { normalizeCode } from "@/lib/codes";
import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

const ERRORS = {
  missing: "Code not found. Check the letters and digits.",
  used: "This code was already used or has expired. Ask the booth for a new one.",
};

// The form submits back here (?code=...). The answer is only "go", "used/expired"
// or "not found": never which company or candidate a code belongs to.
export default async function JoinPage(props: PageProps<"/join">) {
  const { code: raw } = await props.searchParams;
  const typed = typeof raw === "string" ? raw.slice(0, 20) : null;
  let error = "";
  if (typed !== null) {
    const code = normalizeCode(typed);
    const check = await checkCode(code);
    if (check === "ready") redirect(`/c/${code}`);
    error = ERRORS[check];
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <Link href="/" className="inline-flex min-h-10 items-center self-start text-sm font-semibold text-brand-700">← Back</Link>
      <div>
        <p className="text-4xl" aria-hidden>🎟️</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Enter your booth code</h1>
        <p className="mt-1 text-slate-600">It is printed on the card you got at the booth. No name, no CV needed.</p>
      </div>
      <JoinForm initialCode={typed ?? ""} error={error} />
    </main>
  );
}
