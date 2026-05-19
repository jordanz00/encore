/**
 * Authenticated request helpers.
 *
 * Sessions are issued by the /auth routes (Better-Auth-style); this module
 * exposes a tiny `requireUser(req)` wrapper that returns the user record or
 * throws a 401. Real Better-Auth wiring lives in routes/auth.ts.
 */
import type { FastifyRequest } from "fastify";
import { db, schema } from "@encore/db";
import { eq } from "drizzle-orm";

export interface AuthedUser {
  id: string;
  handle: string;
  role: (typeof schema.userRole.enumValues)[number];
}

const SESSION_COOKIE = "encore_session";

export async function getCurrentUser(
  req: FastifyRequest,
): Promise<AuthedUser | null> {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const [session] = await db
    .select({
      userId: schema.userSessions.userId,
      expiresAt: schema.userSessions.expiresAt,
      revokedAt: schema.userSessions.revokedAt,
    })
    .from(schema.userSessions)
    .where(eq(schema.userSessions.tokenHash, tokenHash))
    .limit(1);

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const [user] = await db
    .select({
      id: schema.users.id,
      handle: schema.users.handle,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);

  return user ?? null;
}

export async function requireUser(req: FastifyRequest): Promise<AuthedUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    const err = new Error("unauthorized");
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
  return user;
}

/** Like requireUser, but returns null instead of throwing for anonymous reqs. */
export async function optionalUser(req: FastifyRequest): Promise<AuthedUser | null> {
  return getCurrentUser(req);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
