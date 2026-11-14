import type { Viewport } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getInvitationView } from "@/lib/data";
import { cookieLang } from "@/lib/lang";
import { SKIN_THEME_COLOR } from "@/lib/theme";
import { CandidateShell } from "@/components/CandidateShell";
import { OtherDevice } from "@/components/OtherDevice";
import { isMyAttempt } from "@/lib/device";
import { Waiting } from "./Waiting";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

export default async function DonePage(props: PageProps<"/t/[attemptId]/done">) {
  const { attemptId } = await props.params;
  if (!(await isMyAttempt(attemptId))) return <OtherDevice />;
  const view = await getInvitationView(attemptId);
  if (!view) notFound();
  const qrSvg = view.code
    ? await QRCode.toString(`SKILLSCAN ${view.code}`, { type: "svg", margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
    : null;
  return (
    <CandidateShell lang={(await cookieLang()) ?? view.lang} company={{ name: view.company_name, booth: view.booth }}>
      <Waiting
        attemptId={attemptId}
        booth={view.booth}
        timeUp={view.limit_reached}
        initial={view.code && qrSvg ? { code: view.code, qrSvg } : null}
      />
    </CandidateShell>
  );
}
