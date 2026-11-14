import Link from "@/components/TransitionLink";
import { Plus } from "lucide-react";

// Floating round "+" for the screen's one create action, above the tab bar.
export function FabButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} title={label}
      className="tap fixed bottom-[calc(var(--tabbar)_+_1rem)] right-4 z-20 flex size-14 animate-rise items-center justify-center rounded-pill bg-accent text-bg lg:bottom-6 lg:right-6">
      <Plus className="size-6" strokeWidth={2.5} aria-hidden />
    </Link>
  );
}
