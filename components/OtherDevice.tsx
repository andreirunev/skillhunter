import Link from "next/link";
import { t } from "@/lib/i18n";

// Shown instead of any attempt data when this device does not own the attempt.
export function OtherDevice() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-5xl" aria-hidden>🔒</p>
        <h1 className="mt-4 text-lg font-semibold">{t("en", "otherDevice")}</h1>
        <p lang="fi" className="mt-2 text-sm text-slate-500">{t("fi", "otherDevice")}</p>
        <p lang="sv" className="text-sm text-slate-500">{t("sv", "otherDevice")}</p>
      </div>
      <Link href="/join" className="tap flex min-h-14 items-center justify-center rounded-2xl bg-brand-700 text-lg font-bold text-white">
        🎟️ Enter a booth code
      </Link>
    </main>
  );
}
