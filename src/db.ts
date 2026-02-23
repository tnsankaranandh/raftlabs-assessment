import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI ?? ''

let client: MongoClient | null = null

export async function getDb() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client.db()
}
