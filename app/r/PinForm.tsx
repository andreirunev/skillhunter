"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/Spinner";
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
        className="min-h-12 border border-slate-400 bg-white px-4 text-lg outline-none focus:border-slate-900"
      />
      <p id="pin-error" aria-live="polite" className="min-h-5 text-sm font-medium text-red-700">{state.error}</p>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="btn btn-primary min-h-12 text-base"
      >
        {pending ? <><Spinner />Checking…</> : "Open my booth"}
      </button>
    </form>
  );
}
