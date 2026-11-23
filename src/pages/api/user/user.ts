import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { connectToDatabase } from '@lib/db'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (!session?.user?.email) {
    return res.status(401).json({ message: 'Unauthorized.' })
  }

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const users = await prisma.user.findMany({
        where: { email: { not: session.user.email } },
        select: {
          id: true,
          email: true,
          nickname: true,
          picturePath: true,
        },
        orderBy: { email: 'asc' },
      })
      const messagesByAuthor = new Map<
        string,
        { msgs: Record<string, unknown>[]; unreadCount: number }
      >()

      if (process.env.MONGO_URI && users.length > 0) {
        const client = await connectToDatabase()
        try {
          const messages = await client
            .db()
            .collection('messages')
            .find({
              author: { $in: users.map((user) => user.email) },
              to: session.user.email,
            })
            .toArray()
          for (const message of messages) {
            const authorMessages = messagesByAuthor.get(message.author) ?? {
              msgs: [],
              unreadCount: 0,
            }
            authorMessages.msgs.push(message)
            if (message.read === false) {
              authorMessages.unreadCount += 1
            }
            messagesByAuthor.set(message.author, authorMessages)
          }
        } finally {
          await client.close()
        }
      }

      return res.json({
        status: 200,
        data: users.map((user) => {
          const chat = messagesByAuthor.get(user.email)
          return {
            ...user,
            _id: user.id,
            picpath: user.picturePath,
            msgs: chat?.msgs ?? [],
            unreadCount: chat?.unreadCount ?? 0,
          }
        }),
      })
    } catch (error) {
      console.error('Could not load PostgreSQL users:', error)
      return res.status(500).json({ message: 'Could not load users.' })
    }
  }

  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  
  const users = await usersCollection.aggregate([
    {
      $match : {
        email: {
          $ne: session?.user?.email
        }
    }
    }, {
      $lookup: {
        from: "messages",
        let: { "author": "$email" },
        pipeline: [
          { $match: {
            $expr: {
              $and : [
                { $eq: ['$$author', '$author'] },
                { $eq: [session?.user?.email , '$to'] },
              ]
              
            }
          } }
        ],
        as: "msgs"
      }
    }, {
      $addFields: {
        unreadCount: {
          $size: {
            $filter: {
              input : '$msgs',
              as: "msg",
              cond: {
                $and : [
                  {$eq: [ "$$msg.read", false ]},
                  {$eq: [ "$$msg.to", session?.user?.email ]}
                ]
              }
            }
          }
        }
      }
    }
  ]).toArray()

  client.close()
  return res.json({ status: 200, data: users });
}

export default handler
