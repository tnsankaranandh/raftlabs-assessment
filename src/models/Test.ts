import mongoose from 'mongoose'

const testSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    collection: 'test',
  },
)

export const TestModel =
  mongoose.models.Test || mongoose.model('Test', testSchema)

