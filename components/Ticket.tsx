import { formatCode, TICKET_LABEL, type TicketTemplate } from "@/lib/tickets";

// One 95 x 55 mm booth ticket, black on white (styles: .tk-* in globals.css).
// Used by the A4 print view and the template editor preview.
export function Ticket({ template: t, tasks, code, url, qrSvg }: {
  template: TicketTemplate;
  tasks: number;
  code: string;
  url: string;
  qrSvg: string;
}) {
  return (
    <article className="tk" data-ticket={code}>
      <div className="tk-head">
        <span className="tk-company">{t.companyName}</span>
        <span className="tk-booth">Booth {t.booth}</span>
      </div>
      <p className="tk-label">{TICKET_LABEL}</p>
      <div className="tk-main">
        <div className="tk-left">
          <p className="tk-info">{t.sector} · {tasks} tasks · {t.duration}</p>
          <p className="tk-code">{formatCode(code)}</p>
          <p className="tk-url">Scan, or type the code at {url.replace(/^https?:\/\//, "").replace(/\?.*$/, "")}</p>
        </div>
        <div className="tk-qr" data-qr={url} dangerouslySetInnerHTML={{ __html: qrSvg }} />
      </div>
      <p className="tk-rules">{t.rules}</p>
      <p className="tk-foot">{t.footer}</p>
      <p className="tk-qr-url">{url}</p>
    </article>
  );
}
