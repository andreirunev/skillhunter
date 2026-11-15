// Light / dark for the skinned pages (recruiter and candidate). The choice is
// kept in localStorage under one key; with none saved, the system preference
// decides. Server-safe constants: no "use client" here.

export const THEME_KEY = "skillhunter-theme";

// Inlined in <head>: sets <html data-theme> before the first paint (no flash).
export const THEME_SCRIPT = `(function(){var t;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)})()`;

// Browser chrome colour for skinned pages (same values as --bg).
export const SKIN_THEME_COLOR = [
  { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
  { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
];
