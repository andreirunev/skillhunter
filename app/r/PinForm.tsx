"use client";

import { useActionState } from "react";
import { checkPin } from "./actions";

export function PinForm() {
  const [state, formAction, pending] = useActionState(checkPin, { error: "" });

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
        aria-invalid={Boolean(state.error)}
        aria-describedby="pin-error"
        className="min-h-14 rounded-2xl bg-white px-4 text-lg ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-brand-600"
      />
      <p id="pin-error" aria-live="polite" className="min-h-5 text-sm font-medium text-red-700">{state.error}</p>
      <button
        type="submit"
        disabled={pending}
        className="min-h-14 rounded-2xl bg-brand-700 text-base font-bold text-white shadow-md shadow-brand-700/20 active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "…" : "Open my booth"}
      </button>
    </form>
  );
}
