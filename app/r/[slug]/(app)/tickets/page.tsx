import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { getCompany } from "@/lib/recruiter";
import { defaultTicket, mergeTicket } from "@/lib/tickets";
import { TicketEditor } from "./TicketEditor";

export const dynamic = "force-dynamic";

// Sample code for the preview only; it is not a real code.
const SAMPLE_CODE = "ABCD2345";

// Ticket template: the text printed on this company's booth tickets.
export default async function TicketsPage(props: PageProps<"/r/[slug]/tickets">) {
  const { slug } = await props.params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const defaults = defaultTicket(company);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const sampleUrl = `${proto}://${host}/join?code=${SAMPLE_CODE}`;
  const qrSvg = await QRCode.toString(sampleUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenTitle title="Ticket template" help={{ href: `/r/${slug}/codes`, label: "Booth codes" }} />
      <TicketEditor slug={slug} initial={mergeTicket(company.ticket, defaults)} defaults={defaults}
        tasks={company.task_count} sample={{ code: SAMPLE_CODE, url: sampleUrl, qrSvg }} />
    </div>
  );
}
