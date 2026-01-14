import mongoose from 'mongoose';

const { Schema, SchemaTypes, model } = mongoose;

const userSchema = new Schema({
  name: String,
  isBusiness: Boolean,

  companyName: {
    type: String,
    default: '',
  },

  b2bApiKey: {
    type: String,
    default: '',
  },

  orders: [{
    type: SchemaTypes.ObjectId,
    ref: 'Order',
  }],
  limits: [{
    type: SchemaTypes.ObjectId,
    ref: 'Limit',
  }],
});

const User = model('User', userSchema);
export default User;
