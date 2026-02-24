import mongoose from 'mongoose'
import type { Request, Response, NextFunction } from 'express'

const MONGODB_URI = process.env.MONGODB_URI ?? ''

let isConnected = false

async function connectToDatabase() {
  if (isConnected) return

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  await mongoose.connect(MONGODB_URI)
  isConnected = true
}

export async function mongooseConnectionMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    await connectToDatabase()
    next()
  } catch (err) {
    next(err)
  }
}

