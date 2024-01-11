import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { verifyPassword } from '@lib/auth'
import { connectToDatabase } from '@lib/db'

export const authOptions = {
  session: {
    jwt: true,
  },
  secret: "rLD717hwuAsBTONZrqiGV4bpP1JSFpMNW5vhl+1QaFY=",
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const client = await connectToDatabase()

        const usersCollection = client.db().collection('users')

        const user = await usersCollection.findOne({
          email: credentials.email,
        })

        if (!user) {
          client.close()
          throw new Error('No user found!')
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
