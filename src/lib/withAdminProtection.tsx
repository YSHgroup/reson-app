import React, { ComponentType, useContext } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'context/AuthProvider'

export const withAdminProtection = <P extends object>(
  Component: ComponentType<P>
) => {
  return function ProtectedComponent(props: P) {
    const { role, isAuthenticated } = useAuth()
    const router = useRouter()
    React.useEffect(() => {
      if (!isAuthenticated) {
        router.push('/signin')
      }
      if(!role || role !== 'admin') {
        router.push('/404')
      }
    }, [role, isAuthenticated, router])
    
    return <Component {...props} />
  }
}
