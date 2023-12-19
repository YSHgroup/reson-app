import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  
  const client = await connectToDatabase()

  const cansCallection = client.db().collection('cans');

  let data = JSON.parse(req.body);
  try {
    const applyed = await cansCallection.find({
      author: session?.user?.email,
      need_id: data.need_id,
      status: 'pending'
    }).toArray();
    if(applyed.length > 0) {
      return res.status(RS.SUCCESS_OK).json({
        message: 'Exsit',
      })
    } else {
      const newApply = await cansCallection.insertOne({
        author: session?.user?.email,
        poster: data.poster,
        need_id: data.need_id,
        description: data.desc,
        price: data.price,
        created_at: Date.now(),
        status: 'pending'
      });
      client.close()
      return res.status(RS.SUCCESS_OK).json({
        message: 'Success',
        newApply: newApply
      })
    }
  } catch(error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }

}

export default handler
