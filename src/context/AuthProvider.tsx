import {ReactNode, createContext, useContext } from 'react'

// Define the shape of your AuthContext data
type AuthContextType = {
  role: any; // Replace "any" with appropriate type
  isAuthenticated: boolean;
};

// Now create the context with the defined type
const AuthContext = createContext<AuthContextType>({
  role: null,
  isAuthenticated: true,
});

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext)
}

export const AuthProvider = ({children, session}: {children: ReactNode, session: any}) => {

  const authState: AuthContextType = {
    role: session?.user.role? session.user.role: 'user',
    isAuthenticated: session? true: false,
  }

  return (
      <AuthContext.Provider value={authState}>
          {children}
      </AuthContext.Provider>
  )
}
