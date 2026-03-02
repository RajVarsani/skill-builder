export default function middleware() {
  return new Response('ok')
}

export const config = {
  matcher: '/__test-middleware',
}
