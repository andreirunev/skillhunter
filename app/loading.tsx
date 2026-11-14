import { RouteLoader } from "@/components/FlagLoader";

// Fallback for any route without its own loading.tsx.
export default function Loading() {
  return (
    <div data-skin className="flex min-h-dvh flex-1 flex-col">
      <RouteLoader />
    </div>
  );
}
