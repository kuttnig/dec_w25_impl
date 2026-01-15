import mongoose from 'mongoose';

const { Schema, SchemaTypes, model } = mongoose;

const limitSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'fulfilled', 'expired', 'canceled'],
  },
  validTill: Date,
  price: Number,
  product: {
    type: SchemaTypes.ObjectId,
    ref: 'Product',
  },
  order: {
    type: SchemaTypes.ObjectId,
    ref: 'Order',
  },
});

const Limit = model('Limit', limitSchema);
export default Limit;
