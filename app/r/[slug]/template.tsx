// Remounts when the recruiter switches tabs, so each screen fades in (150ms).
export default function RecruiterTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade">{children}</div>;
}
