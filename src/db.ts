import { MongoClient } from 'mongodb'

const MONGODB_URI =
  'mongodb+srv://tnsankaranandh_db_user:Sankar@91@raftlabs.gnjgxml.mongodb.net/?appName=RaftLabs'

let client: MongoClient | null = null

export async function getDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client.db()
}
