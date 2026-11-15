import { RouteLoader } from "@/components/FlagLoader";

// Inside the recruiter shell: the header and tabs stay, the content loads.
export default function Loading() {
  return <RouteLoader caption="Loading…" />;
}
