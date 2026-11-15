"use client";

import { useActionState } from "react";
import { FlagMini } from "@/components/FlagLoader";
import { checkPin } from "./actions";

// checkPin redirects on a right PIN, so Next.js navigates by itself.
export function PinForm() {
  const [{ error }, formAction, pending] = useActionState(checkPin, { error: "" });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="pin" className="text-sm font-semibold">Company PIN</label>
      <input
        id="pin"
        name="pin"
        type="password"
        autoComplete="off"
        autoCapitalize="none"
        autoFocus
        required
        aria-invalid={Boolean(error)}
        aria-describedby="pin-error"
        className="min-h-12 rounded-card border border-border bg-card px-4 text-lg text-fg outline-none focus:border-fg/40"
      />
      <p id="pin-error" aria-live="polite" className="min-h-5 text-sm font-medium text-bad">{error}</p>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="ui-btn ui-btn-primary min-h-12 text-base"
      >
        {pending ? <><FlagMini />Checking…</> : "Open my booth"}
      </button>
    </form>
  );
}
