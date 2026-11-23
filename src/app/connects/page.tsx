import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../pages/api/auth/[...nextauth]'
import ConnectsBalance from './connects-balance'

type Props = {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}

export default async function ConnectsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  const { success, cancelled } = await searchParams
  const checkoutState = success ? 'success' : cancelled ? 'cancelled' : ''

  return <ConnectsBalance checkoutState={checkoutState} />
}
