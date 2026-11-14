import Link from "next/link";
import { t } from "@/lib/i18n";

// Shown instead of any attempt data when this device does not own the attempt.
export function OtherDevice() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-4 py-12">
      <div className="border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-semibold">{t("en", "otherDevice")}</h1>
        <p lang="fi" className="mt-2 text-sm text-slate-500">{t("fi", "otherDevice")}</p>
        <p lang="sv" className="text-sm text-slate-500">{t("sv", "otherDevice")}</p>
      </div>
      <Link href="/join" className="tap btn btn-primary min-h-12 text-base">
        Enter a booth code
      </Link>
    </main>
  );
}
