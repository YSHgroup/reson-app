import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { connectToDatabase } from '@lib/db'
var pos = require('pos');

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }
  const { email } = req.body

  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')

  const users = await usersCollection.find({ 'email': email }, { projection: { 'picpath': 1, '_id': 0 } }).toArray()

  client.close()

  return res.json({ status: 200, data: users });
}

export default handler
