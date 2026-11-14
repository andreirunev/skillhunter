import Link from "next/link";
import { PinForm } from "./PinForm";

export default function RecruiterLogin() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <Link href="/" className="inline-flex min-h-10 items-center self-start text-sm font-semibold text-brand-700">← Back</Link>
      <div>
        <p className="text-4xl" aria-hidden>🧑‍💼</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Recruiter sign-in</h1>
        <p className="mt-1 text-slate-600">Enter the PIN you got from the fair organiser.</p>
      </div>
      <PinForm />
    </main>
  );
}
