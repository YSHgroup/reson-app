import { createHash } from 'node:crypto'
import { MongoClient, ObjectId, type Document } from 'mongodb'
import { PrismaNeon } from '@prisma/adapter-neon'
import {
  Prisma,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma/client'

const userRoleMap: Record<string, UserRole> = {
  admin: UserRole.admin,
  client: UserRole.client,
  talent: UserRole.talent,
}

function stableId(collection: string, value: unknown) {
  const sourceId =
    value instanceof ObjectId
      ? value.toHexString()
      : String(value ?? `${collection}:unknown`)

  const digest = createHash('sha256')
    .update(`${collection}:${sourceId}`)
    .digest('hex')

  return { id: `legacy_${digest.slice(0, 40)}`, sourceId }
}

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }

  return null
}

function jsonValue(
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined) {
    throw new Error('Cannot serialize an undefined MongoDB document.')
  }
  if (value === null) return Prisma.JsonNull

  const serialized = JSON.stringify(value, (_key, entry: unknown) =>
    entry instanceof ObjectId ? entry.toHexString() : entry
  )

  if (serialized === undefined) {
    throw new Error('MongoDB document serialization returned undefined.')
  }

  return JSON.parse(serialized) as Prisma.InputJsonValue
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

function objectIdValue(value: unknown) {
  if (value instanceof ObjectId) return value.toHexString()
  return typeof value === 'string' ? value : ''
}

async function main() {
  const mongoUri = process.env.LEGACY_MONGO_URI ?? process.env.MONGO_URI
  const databaseUrl = process.env.DATABASE_URL

  if (!mongoUri) {
    throw new Error(
      'Set LEGACY_MONGO_URI or MONGO_URI to the source MongoDB connection string.'
    )
  }
  if (!databaseUrl) {
    throw new Error('Set DATABASE_URL to the destination Neon PostgreSQL URL.')
  }

  const mongo = new MongoClient(mongoUri)
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  })

  try {
    await mongo.connect()
    const db = mongo.db(process.env.LEGACY_MONGO_DATABASE)
    const collections = await db.listCollections().toArray()

    for (const { name } of collections) {
      if (name.startsWith('system.')) continue

      const source = db.collection<Document>(name)
      let imported = 0

      for await (const batch of source.find().batchSize(250).stream()) {
        const document = batch as Document
        const { id, sourceId } = stableId(name, document._id)
        await prisma.legacyDocument.upsert({
          where: {
            sourceCollection_sourceId: {
              sourceCollection: name,
              sourceId,
            },
          },
          create: {
            id,
            sourceCollection: name,
            sourceId,
            data: jsonValue(document),
          },
          update: {},
        })

        if (name === 'users') {
          await importUser(prisma, document, sourceId)
        }

        imported += 1
      }

      console.info(`Imported ${imported} documents from ${name}.`)
    }
    console.info('Legacy MongoDB data is imported; the source database is unchanged.')
  } finally {
    await prisma.$disconnect()
    await mongo.close()
  }

  async function importUser(
    prisma: PrismaClient,
    user: Document,
    sourceId: string
  ) {
    const email = stringValue(user.email).trim().toLowerCase()

    if (!email) {
      console.warn(`Imported legacy user ${sourceId} without a login email.`)
      return
    }

    const derivedBirthday =
      user.year_birth != null &&
      user.month_birth != null &&
      user.day_birth != null
        ? new Date(
            Number(user.year_birth),
            Number(user.month_birth) - 1,
            Number(user.day_birth)
          )
        : null

    const sourceTimestamp =
      user._id instanceof ObjectId ? user._id.getTimestamp() : new Date()
    const createdAt = asDate(user.createdAt) ?? sourceTimestamp
    const password = stringValue(user.password)
    const passwordResetRequired = !password

    await prisma.$transaction(async (transaction) => {
      const migratedUser = await transaction.user.upsert({
        where: { email },
        create: {
          id: stableId('users', user._id).id,
          email,
          password,
          passwordResetRequired,
          nickname: stringValue(user.nickname, email),
          role: userRoleMap[stringValue(user.role)] ?? UserRole.user,
          enabled: Boolean(user.enable),
          verificationCode:
            typeof user.verify_code === 'string' ? user.verify_code : null,
          verificationSentAt: asDate(user.code_send_time),
          firstName: stringValue(user.firstName) || null,
          lastName: stringValue(user.lastName) || null,
          birthday: asDate(derivedBirthday),
          sex: stringValue(user.sex) || null,
          telephone: stringValue(user.telephone) || null,
          address: stringValue(user.address) || null,
          company: stringValue(user.company) || null,
          profession: stringValue(user.profession) || null,
          education: stringValue(user.education) || null,
          hobby: stringValue(user.hobby) || null,
          carExist: stringValue(user.carExist) || null,
          geoLocation: stringValue(user.geoLocation) || null,
          picturePath: stringValue(user.picpath) || null,
          connects: numberValue(user.connects) ?? 0,
          phoneVerified: Boolean(user.phoneVerified),
          skillTestPassed: Boolean(user.skillTestPassed),
          talentBadge: Boolean(user.talentBadge),
          onboardingDone: Boolean(user.onboardingDone),
          stripeCustomerId:
            typeof user.stripeCustomerId === 'string'
              ? user.stripeCustomerId
              : null,
          createdAt,
        },
        update: {},
        select: { id: true },
      })

      await transaction.legacyImport.upsert({
        where: {
          sourceCollection_sourceId: {
            sourceCollection: 'users',
            sourceId,
          },
        },
        create: {
          sourceCollection: 'users',
          sourceId,
          targetModel: 'User',
          targetId: migratedUser.id,
        },
        update: {},
      })
    })
  }
}

main().catch((error: unknown) => {
  console.error('MongoDB user import failed:', error)
  process.exitCode = 1
})
