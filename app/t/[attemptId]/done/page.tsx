import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getInvitationView } from "@/lib/data";
import { Waiting } from "./Waiting";

export const dynamic = "force-dynamic";

export default async function DonePage(props: PageProps<"/t/[attemptId]/done">) {
  const { attemptId } = await props.params;
  const view = await getInvitationView(attemptId);
  if (!view) notFound();
  const qrSvg = view.code
    ? await QRCode.toString(`SKILLSCAN ${view.code}`, { type: "svg", margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
    : null;
  return (
    <Waiting
      attemptId={attemptId}
      lang={view.lang}
      booth={view.booth}
      companyName={view.company_name}
      initial={view.code && qrSvg ? { code: view.code, qrSvg } : null}
    />
  );
}
