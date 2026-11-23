import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../pages/api/auth/[...nextauth]'
import OnboardingForm from './onboarding-form'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  return <OnboardingForm />
}
