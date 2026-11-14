import { RouteLoader } from "@/components/FlagLoader";

// Candidate screens: no caption, so nothing to translate.
export default function Loading() {
  return (
    <div data-skin className="flex min-h-dvh flex-1 flex-col">
      <RouteLoader />
    </div>
  );
}
