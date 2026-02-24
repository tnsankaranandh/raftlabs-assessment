import { Router } from 'express'
import { TestModel } from '../models/Test.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const docs = await TestModel.find({}).lean().exec()
    res.json(docs)
  } catch (err) {
    console.error('getFromDB error:', err)
    res.status(500).json({ error: 'Failed to fetch from database' })
  }
})

export default router
