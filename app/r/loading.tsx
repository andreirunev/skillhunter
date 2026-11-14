import { RouteLoader } from "@/components/FlagLoader";

export default function Loading() {
  return (
    <div data-skin className="flex min-h-dvh flex-1 flex-col">
      <RouteLoader caption="Opening your booth" />
    </div>
  );
}
