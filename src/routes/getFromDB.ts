import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    const docs = await db.collection('test').find({}).toArray()
    res.json(docs)
  } catch (err) {
    console.error('getFromDB error:', err)
    res.status(500).json({ error: 'Failed to fetch from database' })
  }
})

export default router
