import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
// import pos from 'pos'
var pos = require('pos')

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('---------api need object---------')
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
  let { need } = req.body
  let {
    title,
    startLine,
    deadLine,
    price,
    description,
    payType,
    payUnit,
    role,
  } = need
  let createProject = [
    title,
    startLine,
    deadLine,
    price,
    description,
    payType,
    payUnit,
    role,
  ].join(' ')
  console.log(createProject, '------', typeof createProject)
  console.log('error search:', createProject.trim())

  // var pos = require('pos')
  // var wordss = new pos.Lexer().lex(
  //   'This is some sample text. This text can contain multiple sentences.'
  // )
  // var tagger = new pos.Tagger()
  // var taggedWords = tagger.tag(wordss)
  // console.log('tagged', taggedWords)
  // for (let i in taggedWords) {
  //   var taggedWord = taggedWords[i]
  //   var word = taggedWord[0]
  //   var tag = taggedWord[1]
  //   console.log(word + ' /' + tag)
  // }

  let words = new pos.Lexer().lex(createProject)
  // console.log(words)

  var tagger = new pos.Tagger()
  // console.log(tagger)
  var taggedWords = tagger.tag(words)
  console.log(taggedWords)
  let needObject: any = {}

  for (let i in taggedWords) {
    var taggedWord = taggedWords[i]
    var word = taggedWord[0]
    var tag = taggedWord[1]
    console.log(word + ' /' + tag)
    needObject[tag + i] = word
  }

  needObject['user_id'] = user?._id
  needObject['current_date'] = current_date
  needObject['current_time'] = current_time
  needObject['author'] = user?.firstName + ' ' + user?.lastName
  needObject['length_of_firstname'] = user?.firstName?.length ?? 0
  needObject['length_of_lastname'] = user?.lastName?.length ?? 0
  console.table(needObject)
  await messageCollection.insertOne(needObject)

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
  })
}

export default handler
