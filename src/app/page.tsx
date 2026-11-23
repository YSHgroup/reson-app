import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '../pages/api/auth/[...nextauth]'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  redirect(session ? '/dashboard' : '/signin')
}
