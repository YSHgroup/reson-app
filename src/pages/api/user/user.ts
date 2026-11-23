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
      return res.json({
        status: 200,
        data: users.map((user) => ({
          ...user,
          _id: user.id,
          picpath: user.picturePath,
          msgs: [],
          unreadCount: 0,
        })),
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
