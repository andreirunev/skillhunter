import { randomInt } from "node:crypto";

// No 0/O, 1/I/L: codes are read aloud and typed at the booth.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const randomString = (length: number) =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

// Single-use QR token (about 40 bits): enough to be unguessable at a fair.
export const makeToken = () => randomString(8);

// Short code the candidate shows at the booth, e.g. "KX-47".
export const makeInviteCode = () => `${randomString(2)}-${randomInt(10, 100)}`;
