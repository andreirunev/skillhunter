import { randomInt } from "node:crypto";

// No 0/O, 1/I/L: codes are read aloud and typed at the booth.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const randomString = (length: number) =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

// Single-use QR token (about 40 bits): enough to be unguessable at a fair.
export const makeToken = () => randomString(8);

// Interview code, e.g. "7K4M": only the candidate's phone shows it, and the
// recruiter types it to prove the person at the booth owns the attempt.
export const makeInviteCode = () => randomString(4);

// Printed booth codes = single-use tokens typed at /join.
export const PRINTED_CODE_DAYS = 7;
export const MAX_CODES_PER_BATCH = 50;
export const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[\s-]/g, "");
export const isCodeShape = (code: string) => /^[A-Z0-9]{8}$/.test(code);
