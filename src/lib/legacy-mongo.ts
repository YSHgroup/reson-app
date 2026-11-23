import { MongoClient } from 'mongodb'
import 'server-only'

let client: MongoClient | undefined

export async function connectToLegacyMongo() {
  const uri = process.env.LEGACY_MONGO_URI ?? process.env.MONGO_URI
  if (!uri) {
    throw new Error(
      'Set LEGACY_MONGO_URI or MONGO_URI before importing legacy MongoDB data.'
    )
  }

  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }

  return client.db(process.env.LEGACY_MONGO_DATABASE)
}
