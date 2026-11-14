import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { PRINTED_CODE_DAYS } from "./codes.ts";
import { ownsAttempt } from "./data.ts";

// One random id per candidate device, kept in an httpOnly cookie. The database
// stores only its SHA-256 on the attempt (owner_hash): no device info, no IP.
export const DEVICE_COOKIE = "ss_device";
const VALID = /^[A-Za-z0-9_-]{32}$/;
const hashId = (id: string) => createHash("sha256").update(id).digest("base64url");

// The device behind a request, or a fresh random id if it has none yet.
export function readDevice(value: string | undefined) {
  if (value && VALID.test(value)) return { id: value, hash: hashId(value), isNew: false };
  const id = randomBytes(24).toString("base64url");
  return { id, hash: hashId(id), isNew: true };
}

// Set only when a code is actually burned, so plain visitors get no cookie.
export function setDeviceCookie(res: NextResponse, id: string) {
  res.cookies.set(DEVICE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PRINTED_CODE_DAYS * 86_400,
  });
}

export async function deviceHash(): Promise<string | null> {
  const id = (await cookies()).get(DEVICE_COOKIE)?.value;
  return id && VALID.test(id) ? hashId(id) : null;
}

export async function isMyAttempt(attemptId: string): Promise<boolean> {
  return ownsAttempt(attemptId, await deviceHash());
}
