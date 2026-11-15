"use client";

import { useActionState } from "react";
import { FlagMini } from "@/components/FlagLoader";
import { checkPin } from "./actions";

// checkPin redirects on a right PIN, so Next.js navigates by itself.
export function usePinAction() {
  const [state, formAction, pending] = useActionState(checkPin, { error: "" });
  return { error: state.error, formAction, pending };
}

export function PinForm() {
  const { error, formAction, pending } = usePinAction();

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="pin" className="text-sm font-semibold text-slate-700">Company PIN</label>
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
        className="min-h-12 border border-slate-400 bg-white px-4 text-lg outline-none focus:border-slate-900"
      />
      <p id="pin-error" aria-live="polite" className="min-h-5 text-sm font-medium text-red-700">{error}</p>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="btn btn-primary min-h-12 text-base"
      >
        {pending ? <><FlagMini />Checking…</> : "Open my booth"}
      </button>
    </form>
  );
}
