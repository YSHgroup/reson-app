import { NextRequest, NextResponse } from 'next/server'

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  let ip = request.headers.get('x-real-ip')
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(',').at(0) ?? 'Unknown'
  }

  if (ip) {
    try {
      const locationResponse = await fetch('https://ipapi.co/json')
      if (!locationResponse.ok) {
        throw new Error(`Location lookup failed: ${locationResponse.status}`)
      }

      const location: { longitude?: number; latitude?: number } =
        await locationResponse.json()

      if (location.longitude != null && location.latitude != null) {
        response.cookies.set('lang', String(location.longitude), {
          httpOnly: false,
        })
        response.cookies.set('lat', String(location.latitude), {
          httpOnly: false,
        })
      }
    } catch (error) {
      console.error('Unable to look up request location:', error)
    }

    response.cookies.set('user-ip', ip, {
      httpOnly: false,
    })
  }

  return response
}
