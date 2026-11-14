// Runs once when a Next.js server starts: create the schema and seed demo data
// before the first request.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getDb } = await import("./lib/db");
    getDb();
    console.log("[skillscan] database ready");
  }
}
