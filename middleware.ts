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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 放行静态资源（非常重要，不然页面会加载不全）
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Basic ')) return unauthorized()

  let decoded = ''
  try {
    decoded = atob(auth.slice('Basic '.length))
  } catch {
    return unauthorized()
  }

  // Basic Auth 格式是 "username:password"
  const idx = decoded.indexOf(':')
  const pass = idx >= 0 ? decoded.slice(idx + 1) : ''

  if (pass !== PASS) return unauthorized()

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
