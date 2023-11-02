import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
var pos = require('pos');

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }
  
  // const session = await getSession({
  //     req,
  // })
  
  const session = await getServerSession(req, res, authOptions)

  //   const { message } = req.body
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  const {email} = JSON.parse(req.body)
  const user = await usersCollection.findOne({
    email: email
  })

  client.close()
  return res.json({ status: 200, data: user });
}

export default handler
