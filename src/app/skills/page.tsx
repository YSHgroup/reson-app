import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../pages/api/auth/[...nextauth]'
import SkillAssessment from './skill-assessment'

export default async function SkillsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  return <SkillAssessment />
}
