import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
// import pos from 'pos'
var pos = require('pos')

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('---------api can object---------')
  if (req.method !== 'POST') {
    return
  }

  var today = new Date()
  var Y = today.getFullYear()
  var M = today.getMonth() + 1
  var D = today.getDate()
  var h = today.getHours()
  var m = today.getMinutes()
  var s = today.getSeconds()

  var current_date = Y + '/' + M + '/' + D
  var current_time = h + ':' + m + ':' + s

  // const session = await getSession({
  //     req,
  // })
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )

  //   const { message } = req.body
  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')

  const user = await usersCollection.findOne({
    email: session?.user?.email,
  })

  const messageCollection = client.db().collection('messagestagger')
  let { can } = req.body
  let {
    title,
    payUnit,
    role,
  } = can
  let createProject = [
    title,
    payUnit,
    role,
  ].join(' ')

  let words = new pos.Lexer().lex(createProject)

  var tagger = new pos.Tagger()
  var taggedWords = tagger.tag(words)
  console.log(taggedWords)
  let searchObject: any = {}

  for (let i in taggedWords) {
    var taggedWord = taggedWords[i]
    var word = taggedWord[0]
    var tag = taggedWord[1]
    console.log(word + ' /' + tag)
    searchObject[tag + i] = word
  }

  searchObject['user_id'] = user?._id
  searchObject['current_date'] = current_date
  searchObject['current_time'] = current_time
  searchObject['author'] = user?.firstName + ' ' + user?.lastName
  searchObject['length_of_firstname'] = user?.firstName?.length ?? 0
  searchObject['length_of_lastname'] = user?.lastName?.length ?? 0
  console.table(searchObject)
  await messageCollection.insertOne(searchObject)

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
  })
}

export default handler
