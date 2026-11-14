import Link from "@/components/TransitionLink";
import { CandidateShell } from "@/components/CandidateShell";
import { t } from "@/lib/i18n";

// Shown instead of any attempt data when this device does not own the attempt.
// All three languages at once, so there is no language switch here.
export function OtherDevice() {
  return (
    <CandidateShell lang="en" company={null} showLang={false}>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
        <div className="rounded-card border border-border bg-card p-4">
          <h1 className="text-lg font-semibold">{t("en", "otherDevice")}</h1>
          <p lang="fi" className="mt-2 text-sm text-muted">{t("fi", "otherDevice")}</p>
          <p lang="sv" className="text-sm text-muted">{t("sv", "otherDevice")}</p>
        </div>
        <Link href="/join" className="ui-btn ui-btn-primary min-h-12 text-base">{t("en", "enterCode")}</Link>
      </main>
    </CandidateShell>
  );
}
