import { Router } from 'express'
import homeRoutes from './home.js'
import aboutRoutes from './about.js'
import apiDataRoutes from './api-data.js'
import getFromDBRoutes from './getFromDB.js'
import dbDataRoutes from './db-data.js'
import healthzRoutes from './healthz.js'

const router = Router()

router.use('/', homeRoutes)
router.use('/about', aboutRoutes)
router.use('/api-data', apiDataRoutes)
router.use('/getFromDB', getFromDBRoutes)
router.use('/db-data', dbDataRoutes)
router.use('/healthz', healthzRoutes)

export default router
