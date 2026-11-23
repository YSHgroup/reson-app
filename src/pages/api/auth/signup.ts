import { MINIMAL_PASSWORD_LENGTH } from '@constants/UserSignup'
import { NextApiRequest, NextApiResponse } from 'next'
import { hashPassword } from '@lib/auth'
import { connectToDatabase, } from '@lib/db'
import { prisma } from '@lib/prisma'
import sendEmail from '@lib/sendEmail'
import randomMaker from '@lib/randomMaker'
import RS from '@constants/ResponseStatus'
import { UserRole } from '../../../generated/prisma/client'
import type { Document } from 'mongodb'

async function syncProfileUser(user: Document) {
  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
  if (!email) return

  const role =
    user.role === 'talent'
      ? UserRole.talent
      : user.role === 'client'
        ? UserRole.client
        : UserRole.user
  const birthday =
    user.year_birth && user.month_birth && user.day_birth
      ? new Date(
          Number(user.year_birth),
          Number(user.month_birth) - 1,
          Number(user.day_birth)
        )
      : null

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: typeof user.password === 'string' ? user.password : '',
      passwordResetRequired:
        typeof user.password !== 'string' || !user.password,
      nickname: typeof user.nickname === 'string' ? user.nickname : email,
      role,
      enabled: Boolean(user.enable),
      verificationCode:
        typeof user.verify_code === 'string' ? user.verify_code : null,
      verificationSentAt:
        user.code_send_time != null
          ? new Date(Number(user.code_send_time))
          : null,
      birthday: birthday && !Number.isNaN(birthday.getTime()) ? birthday : null,
      sex: typeof user.sex === 'string' ? user.sex : null,
    },
    update: {},
  })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  try {
    const data = req.body
  
    let { email, password, birthday, nickname, sex, lang, role } = data
    email = typeof email === 'string' ? email.trim().toLowerCase() : ''
    nickname = typeof nickname === 'string' ? nickname.trim() : ''
    role = role === 'talent' || role === 'client' ? role : 'user'
    if (!sex)
      sex = 'male';
    const status = 0
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !nickname ||
      !password ||
      password.trim().length < MINIMAL_PASSWORD_LENGTH
    ) {
      res.status(RS.CERROR_UNPROCESSABLE).json({
        message:
          'Invalid input - password should also be at least 7 characters long.',
      })
      return
    }
  
     const client = await connectToDatabase()
  
     const db = client.db()
  
     const date = new Date()
  
     let day = date.getDate()
     let month = date.getMonth() + 1
     let year = date.getFullYear()
     let hour = date.getHours()
     let min = date.getMinutes()
     let sec = date.getSeconds()
  
     let processed_birthday = new Date(birthday)
  
     let day_birth = processed_birthday.getDate()
     let month_birth = processed_birthday.getMonth() + 1
     let year_birth = processed_birthday.getFullYear()
     let hour_birth = processed_birthday.getHours()
     let min_birth = processed_birthday.getMinutes()
     let sec_birth = processed_birthday.getSeconds()
  
     const existingUser = await db.collection('users').findOne({
       email,
     })
  
     if (existingUser) {
       if (process.env.DATABASE_URL) {
         await syncProfileUser(existingUser)
       }
       res.status(RS.CERROR_UNPROCESSABLE).json({
         message: 'User exists already!',
       })
      client.close()
       return
     }
  
     const hashedPassword = await hashPassword(password)
  
    const enable = false
    const verify_code = randomMaker(20);
    const code_send_time = Date.now()

    role = role? role: 'user'
  
    const user =  await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      day_birth,
      month_birth,
      year_birth,
      nickname,
      sex,
      day,
      month,
      year,
      hour,
      min,
      sec,
      enable,
      verify_code,
      code_send_time,
      status,
      role
    })

    if (process.env.DATABASE_URL) {
      await syncProfileUser({
        ...data,
        email,
        nickname,
        password: hashedPassword,
        sex,
        role,
        enable,
        verify_code,
        code_send_time,
        day_birth,
        month_birth,
        year_birth,
      })
    }
  
    await db.collection('settings').insertOne({
      user_id: user.insertedId,
      language: lang,
      modus: 0,
      status: 0,
      show_firstname: 0,
      show_lastname: 0,
      show_email: 0,
      show_telephone: 0,
      show_analyse: 0,
      show_position: 0,
    })
  
    const message = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify/${user.insertedId}/${verify_code}`
    sendEmail(email, "Verify Email" ,message)
  
    res.status(RS.SUCCESS_CREATED).json({
      message: 'Created user!',
    })
  } catch (error) {
    res.status(400).json({ message: "An error occured" })
  }
  // client.close()
}

export default handler
