import express from 'express'
import routes from './routes/index.js'
import { mongooseConnectionMiddleware } from './mongoose.js'

const app = express()

app.use(mongooseConnectionMiddleware)
app.use(routes)

export default app
