import type { ReactNode } from "react";

// Remounts on every recruiter tab change, so the page fades in (globals.css,
// .page-in). No loading.tsx here: the previous page stays until the next is ready.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
