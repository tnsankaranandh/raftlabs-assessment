import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    message: 'Here is some sample API data',
    items: ['apple', 'banana', 'cherry'],
  })
})

export default router
