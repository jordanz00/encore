/**
 * Auth routes (Better-Auth-style minimal scaffold).
 *
 * Implemented:
 *   POST /auth/sign-up        — email + password (scrypt hash, demo)
 *   POST /auth/sign-in        — email + password → session cookie
 *   POST /auth/sign-out       — revoke current session
 *   GET  /auth/me             — return current user
 *
 * NOT YET implemented (RFC 008): OAuth, passkeys, 2FA, magic links.
 * Replace this scaffold with `better-auth` when wiring real providers.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@encore/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../lib/auth.js";
import crypto from "node:crypto";

const SESSION_COOKIE = "encore_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export async function registerAuth(app: FastifyInstance): Promise<void> {
  const signUpSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(200),
    handle: z
      .string()
      .min(2)
      .max(32)
      .regex(/^[a-z0-9_-]+$/),
    displayName: z.string().min(1).max(80).optional(),
  });

  app.post("/sign-up", async (req, reply) => {
    const body = signUpSchema.parse(req.body);
    const passwordHash = await scrypt(body.password);

    const [user] = await db
      .insert(schema.users)
      .values({
        email: body.email,
        handle: body.handle,
        displayName: body.displayName ?? body.handle,
        role: "listener",
      })
      .returning();

    if (!user) return reply.code(409).send({ error: "user_exists" });

    await db.insert(schema.userCredentials).values({
      userId: user.id,
      passwordHash,
    });

    const token = await issueSession(user.id, req.headers["user-agent"] ?? null);
    setSessionCookie(reply, token);
    return { user: { id: user.id, handle: user.handle, role: user.role } };
  });

  const signInSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(200),
  });

  app.post("/sign-in", async (req, reply) => {
    const body = signInSchema.parse(req.body);
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, body.email))
      .limit(1);
    if (!user) return reply.code(401).send({ error: "invalid_credentials" });

    const [creds] = await db
      .select()
      .from(schema.userCredentials)
      .where(eq(schema.userCredentials.userId, user.id))
      .limit(1);
    if (!creds?.passwordHash) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const ok = await scryptVerify(body.password, creds.passwordHash);
    if (!ok) return reply.code(401).send({ error: "invalid_credentials" });

    const token = await issueSession(user.id, req.headers["user-agent"] ?? null);
    setSessionCookie(reply, token);
    return { user: { id: user.id, handle: user.handle, role: user.role } };
  });

  app.post("/sign-out", async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) {
      const tokenHash = sha256Hex(token);
      await db
        .update(schema.userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(schema.userSessions.tokenHash, tokenHash));
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/me", async (req, reply) => {
    const user = await getCurrentUser(req);
    if (!user) return reply.code(401).send({ error: "unauthorized" });
    return { user };
  });
}

async function issueSession(
  userId: string,
  userAgent: string | null,
): Promise<string> {
  const raw = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(raw);
  await db.insert(schema.userSessions).values({
    userId,
    tokenHash,
    userAgent,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return raw;
}

function setSessionCookie(
  reply: { setCookie: (n: string, v: string, opts: Record<string, unknown>) => unknown },
  token: string,
): void {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function scrypt(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function scryptVerify(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1]!, "base64url");
  const expected = Buffer.from(parts[2]!, "base64url");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, d) => {
      if (err) reject(err);
      else resolve(d);
    });
  });
  return crypto.timingSafeEqual(derived, expected);
}
