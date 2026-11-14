import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Ticket } from "@/components/Ticket";
import { getCompany, listBatch } from "@/lib/recruiter";
import { defaultTicket, TICKETS_PER_SHEET } from "@/lib/tickets";
import { PrintBar } from "./PrintBar";

export const dynamic = "force-dynamic";

// A4 only on this page: no page margin, the sheet draws its own 10 mm margin.
const PAGE_CSS = "@page { size: A4; margin: 0; }";

// The site this request came in on, so the QR opens the same deployment.
async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Print view for one batch of booth codes: A4 sheets of 10 tickets, no app
// chrome. Only codes that are still free are printed.
export default async function PrintPage(props: PageProps<"/r/[slug]/print/[batchId]">) {
  const { slug, batchId } = await props.params;
  const { auto } = await props.searchParams;
  const company = await getCompany(slug);
  if (!company) notFound();
  const codes = await listBatch(company.test_id, batchId);
  if (!codes) notFound();

  const template = defaultTicket(company);
  const origin = await siteOrigin();
  const free = codes.filter((c) => !c.taken).map((c) => c.code);
  const tickets = await Promise.all(free.map(async (code) => {
    const url = `${origin}/join?code=${code}`;
    const qrSvg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
    return { code, url, qrSvg };
  }));
  const sheets = Array.from({ length: Math.ceil(tickets.length / TICKETS_PER_SHEET) }, (_, i) =>
    tickets.slice(i * TICKETS_PER_SHEET, (i + 1) * TICKETS_PER_SHEET));

  return (
    <div className="pv-root">
      <style>{PAGE_CSS}</style>
      <PrintBar backHref={`/r/${slug}/codes`} tickets={tickets.length} sheets={sheets.length}
        skipped={codes.length - free.length} auto={auto === "1"} />
      {sheets.map((sheet, i) => (
        <section key={i} className="pv-sheet" aria-label={`Sheet ${i + 1} of ${sheets.length}`}>
          <CutMarks />
          <div className="pv-grid">
            {sheet.map((t) => (
              <Ticket key={t.code} template={template} tasks={company.task_count} code={t.code} url={t.url} qrSvg={t.qrSvg} />
            ))}
          </div>
          {sheets.length > 1 && <p className="pv-sheet-no">Sheet {i + 1} of {sheets.length}</p>}
        </section>
      ))}
    </div>
  );
}

// In mm on the A4 sheet: dashed cut lines around every 95 x 55 mm ticket
// (grid from 10,10 to 200,285) and solid crop marks off the four outer corners.
function CutMarks() {
  const xs = [10, 105, 200];
  const ys = [10, 65, 120, 175, 230, 285];
  const dash = { stroke: "#000", strokeWidth: 0.2, strokeDasharray: "2 1.5" };
  const mark = { stroke: "#000", strokeWidth: 0.25 };
  return (
    <svg className="pv-marks" viewBox="0 0 210 297" aria-hidden>
      {xs.map((x) => <line key={`x${x}`} x1={x} y1={10} x2={x} y2={285} {...dash} />)}
      {ys.map((y) => <line key={`y${y}`} x1={10} y1={y} x2={200} y2={y} {...dash} />)}
      {[[10, 10, -1, -1], [200, 10, 1, -1], [10, 285, -1, 1], [200, 285, 1, 1]].map(([x, y, dx, dy]) => (
        <g key={`${x}-${y}`} {...mark}>
          <line x1={x + dx * 2} y1={y} x2={x + dx * 7} y2={y} />
          <line x1={x} y1={y + dy * 2} x2={x} y2={y + dy * 7} />
        </g>
      ))}
    </svg>
  );
}
