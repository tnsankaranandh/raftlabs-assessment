import mongoose from 'mongoose'
import type { MenuItem as IMenuItem } from '../types'

const menuItemSchema = new mongoose.Schema<IMenuItem & mongoose.Document>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
)

export const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema)
