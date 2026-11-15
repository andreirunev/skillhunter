import type { Viewport } from "next";
import Link from "next/link";
import { SKIN_THEME_COLOR } from "@/lib/theme";
import { PinForm } from "./PinForm";

export const viewport: Viewport = { themeColor: SKIN_THEME_COLOR };

export default function RecruiterLogin() {
  return (
    <div data-skin className="flex min-h-dvh flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
        <Link href="/" className="tap -ml-1 inline-flex min-h-11 items-center self-start px-1 text-sm font-semibold text-muted">← Back</Link>
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">Recruiter sign-in</h1>
          <p className="mt-1 text-[15px] text-muted">Enter the PIN you got from the fair organiser.</p>
        </div>
        <PinForm />
      </main>
    </div>
  );
}
