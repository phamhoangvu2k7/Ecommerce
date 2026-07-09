import { jwtVerify, SignJWT } from 'jose'

/**
 * Signs a payload to generate a JWT token using HS256 algorithm.
 * Works natively on Edge runtimes (Cloudflare Workers/Pages) and Node.js.
 */
export async function signJwt(
  payload: any,
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
export async function verifyJwt(token: string, secret: string): Promise<any> {
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)

  try {
    const { payload } = await jwtVerify(token, secretKey)
    return payload
  }
  catch (err: any) {
    // Standardize error message for token expiry to maintain compatibility
    if (err.code === 'ERR_JWT_EXPIRED') {
      throw new Error('Token expired')
    }
    throw new Error(err.message || 'Signature verification failed')
  }
}
