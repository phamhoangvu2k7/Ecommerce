import type { JWTPayload } from 'jose'
import { jwtVerify, SignJWT } from 'jose'

/**
 * Signs a payload to generate a JWT token using HS256 algorithm.
 * Works natively on Edge runtimes (Cloudflare Workers/Pages) and Node.js.
 */
export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  options: { expiresIn?: string } = {},
): Promise<string> {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)

  const jwtSigner = new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()

  if (options.expiresIn) {
    jwtSigner.setExpirationTime(options.expiresIn)
  }

  return await jwtSigner.sign(secretKey)
}

/**
 * Verifies a JWT token using HS256 algorithm and returns the decoded payload.
 * Throws an error if the signature is invalid or the token has expired.
 */
export async function verifyJwt<T = JWTPayload>(token: string, secret: string): Promise<T> {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)

  try {
    const { payload } = await jwtVerify(token, secretKey)
    return payload as T
  }
  catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ERR_JWT_EXPIRED') {
      throw new Error('Token expired')
    }
    const msg = (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') ? err.message : 'Signature verification failed'
    throw new Error(msg)
  }
}
