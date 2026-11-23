import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { verifyPassword } from '@lib/auth'
import { connectToDatabase } from '@lib/db'

/** @type {import('next-auth').NextAuthOptions} */
export const authOptions = {
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (
          !credentials?.email ||
          typeof credentials.password !== 'string' ||
          !credentials.password
        ) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        if (process.env.DATABASE_URL) {
          const { prisma } = await import('@lib/prisma')
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              passwordResetRequired: true,
              enabled: true,
              nickname: true,
              picturePath: true,
              role: true,
            },
          })

          if (!user || user.passwordResetRequired || !user.enabled) {
            return null
          }

          const isValid = await verifyPassword(
            credentials.password,
            user.password
          )
          if (!isValid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.nickname,
            image: user.picturePath,
            role: user.role,
          }
        }

        const client = await connectToDatabase()

        const usersCollection = client.db().collection('users')

        const user = await usersCollection.findOne({
          email,
        })

        if (!user) {
          client.close()
          throw new Error('No user found!')
        }

        if (user.passwordResetRequired || !user.password) {
          client.close()
          throw new Error('Password reset required!')
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        )

        if (!isValid) {
          client.close()
          throw new Error('Could not log you in!')
        }

        client.close()
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.nickname,
          image: user.picpath,
          role: user.role
        }
      },
    }),
  ],
  callbacks: {
    // async signIn({ user, account, profile, email, credentials, }) {
    //   if (user.role !== 'admsin') {
    //     throw new Error('/admin')
    //   }
    //   return true
    // }
    async jwt({ token, user }) {
      // If the user object is available means that this is first-time JWT creation
      // Save the user's role in the JWT token
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, user, token }) {
      // Add the `role` property to the session's user object
      session.user.role = token.role; // Or token.role, depending on where you store it
      return session;
    },
  }
}

export default NextAuth(authOptions)
