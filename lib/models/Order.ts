import mongoose from 'mongoose'
import type { Order as IOrder } from '../types'

const orderItemSchema = new mongoose.Schema({
  itemId: String,
  name: String,
  price: Number,
  quantity: Number,
})

const orderCustomerSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
})

const orderSchema = new mongoose.Schema<IOrder & mongoose.Document>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    items: [orderItemSchema],
    customer: orderCustomerSchema,
    status: {
      type: String,
      enum: ['ORDER_RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'],
      default: 'ORDER_RECEIVED',
    },
    createdAt: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: false, updatedAt: 'updatedAt' } },
)

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
