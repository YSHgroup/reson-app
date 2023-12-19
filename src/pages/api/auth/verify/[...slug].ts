import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@lib/db'
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return
  }
  
  const { slug } = req.query

  const client = await connectToDatabase()
  const usersCollection = client.db().collection('users')
  if (slug == undefined)
    return res.status(400).send({ error: 'Input Error' })
  
  const user = await usersCollection.findOne({'_id': new ObjectId(slug[0])});

  if (user?.verify_code == slug[1]) {
    await usersCollection.updateOne({'_id': new ObjectId(slug[0])}, {$set: {enable: true}})
    client.close()
    try {
      res.redirect(307, '/signin')
    } catch (err) {
      res.status(500).send({ error: err })
    }
  } else {
    console.log('fail')
    client.close()
    return res.json({ status: 404, msg: 'fail' });
  }
}

export default handler
