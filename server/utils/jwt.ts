function base64urlEncode(str: Uint8Array | string): string {
  let base64: string
  if (typeof str === 'string') {
    // Unicode-safe base64 encoding
    base64 = btoa(unescape(encodeURIComponent(str)))
  }
  else {
    base64 = btoa(String.fromCharCode(...str))
  }
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  // Unicode-safe base64 decoding
  return decodeURIComponent(escape(atob(base64)))
}

export async function signJwt(payload: any, secret: string, options: { expiresIn?: string } = {}): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerStr = base64urlEncode(JSON.stringify(header))

  const payloadCopy = { ...payload }
  if (options.expiresIn) {
    const unit = options.expiresIn.slice(-1)
    const val = parseInt(options.expiresIn.slice(0, -1), 10)
    let seconds = 0
    if (unit === 'd')
      seconds = val * 24 * 60 * 60
    else if (unit === 'h')
      seconds = val * 60 * 60
    else if (unit === 'm')
      seconds = val * 60
    else if (unit === 's')
      seconds = val
    else
      seconds = parseInt(options.expiresIn, 10) || 0

    payloadCopy.exp = Math.floor(Date.now() / 1000) + seconds
  }

  const payloadStr = base64urlEncode(JSON.stringify(payloadCopy))
  const dataToSign = `${headerStr}.${payloadStr}`

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataToSign),
  )

  const signatureStr = base64urlEncode(new Uint8Array(signature))
  return `${dataToSign}.${signatureStr}`
}

export async function verifyJwt(token: string, secret: string): Promise<any> {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token format')
  }

  const [headerStr, payloadStr, signatureStr] = parts
  const dataToSign = `${headerStr}.${payloadStr}`

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  // Decode the signature safely
  const sigBinary = atob(signatureStr.replace(/-/g, '+').replace(/_/g, '/'))
  const sigBytes = new Uint8Array(sigBinary.length)
  for (let i = 0; i < sigBinary.length; i++) {
    sigBytes[i] = sigBinary.charCodeAt(i)
  }

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    enc.encode(dataToSign),
  )

  if (!isValid) {
    throw new Error('Signature verification failed')
  }

  const payload = JSON.parse(base64urlDecode(payloadStr))
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Token expired')
  }

  return payload
}
