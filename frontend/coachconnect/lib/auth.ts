// lib/auth.ts
import { SignJWT, jwtVerify } from "jose"

const SECRET_STRING =
  "dev-only-super-long-random-secret-please-change-me-8c3a4f7b3e51a0e2c9d4f2bb1e6a9d77"
const secret = new TextEncoder().encode(SECRET_STRING)
const ALG = "HS256"

export type SessionPayload = {
  sub: string          // user id
  email: string
  role: "client" | "trainer"
  first_name?: string
  last_name?: string
  country?: string
  phone_number?: string
}

export async function createSession(
  payload: SessionPayload,
  maxAgeSec = 60 * 60 * 24 * 7
) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(secret)

  return token
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as SessionPayload
}
