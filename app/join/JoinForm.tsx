"use client";

import { useState } from "react";
import Form from "next/form";
import { useFormStatus } from "react-dom";

export function JoinForm({ initialCode, error }: { initialCode: string; error: string }) {
  // Controlled, so the code stays in the box after an error and can be fixed.
  const [code, setCode] = useState(initialCode.toUpperCase());

  return (
    <Form action="" className="flex flex-col gap-3">
      <label htmlFor="code" className="text-sm font-semibold text-slate-700">Booth code</label>
      <input
        id="code"
        name="code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        type="text"
        inputMode="text"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        maxLength={12}
        placeholder="UQE6CRCP"
        required
        aria-invalid={Boolean(error)}
        aria-describedby="code-error"
        className="min-h-16 rounded-2xl bg-white px-4 text-center font-mono text-3xl font-bold tracking-[0.2em] ring-1 ring-slate-300 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-brand-600"
      />
      <p id="code-error" aria-live="polite" className="min-h-10 text-center text-sm font-medium text-red-700">{error}</p>
      <StartButton />
    </Form>
  );
}

function StartButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-14 rounded-2xl bg-brand-700 text-lg font-bold text-white shadow-md shadow-brand-700/20 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Checking…" : "Start"}
    </button>
  );
}
