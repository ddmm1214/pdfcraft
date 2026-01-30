import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASS = process.env.SITE_PASSWORD || 'change-me'

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="PDFCraft"',
    },
  })
}

// Edge-safe base64 decode (no Buffer)
function base64Decode(b64: string): string {
  // Prefer atob if available
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(b64)
  }

  // Fallback base64 decoder
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let str = b64.replace(/=+$/, '')
  let output = ''

  let buffer = 0
  let bits = 0
  for (let i = 0; i < str.length; i++) {
    const val = chars.indexOf(str[i])
    if (val < 0) continue
    buffer = (buffer << 6) | val
    bits += 6
    if (bits >= 8) {
      bits -= 8
      output += String.fromCharCode((buffer >> bits) & 0xff)
    }
  }
  return output
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 放行静态资源（不然页面资源会被挡）
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Basic ')) return unauthorized()

  let decoded = ''
  try {
    decoded = base64Decode(auth.slice('Basic '.length).trim())
  } catch {
    return unauthorized()
  }

  // decoded is "username:password"
  const idx = decoded.indexOf(':')
  const pass = idx >= 0 ? decoded.slice(idx + 1) : ''

  if (!pass || pass !== PASS) return unauthorized()

  return NextResponse.next()
}

export const config = {
  // 只拦页面路由；静态资源通过 pathname.includes('.') 放行
  matcher: ['/((?!_next).*)'],
}
