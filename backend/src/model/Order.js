import mongoose from 'mongoose';

const { Schema, SchemaTypes, model } = mongoose;

const orderSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'fulfilled', 'expired', 'canceled'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  offer: {
    type: SchemaTypes.ObjectId,
    ref: 'Offer',
  },
});

const Order = model('Order', orderSchema);
export default Order;
