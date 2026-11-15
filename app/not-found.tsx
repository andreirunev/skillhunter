import type { Viewport } from "next";
import Link from "next/link";
import { SKIN_THEME_COLOR } from "@/lib/theme";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

// Any unknown URL, company, attempt or print batch.
export default function NotFound() {
  return (
    <div data-skin className="flex min-h-dvh flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">404</p>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">Page not found</h1>
        <p className="text-[15px] text-muted">The link may be old or mistyped.</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/join" className="ui-btn ui-btn-primary min-h-12 text-base">Enter a booth code</Link>
          <Link href="/" className="ui-btn ui-btn-secondary min-h-12 text-base">Home</Link>
        </div>
      </main>
    </div>
  );
}
