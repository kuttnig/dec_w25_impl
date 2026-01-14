import mongoose from 'mongoose';

const { Schema, SchemaTypes, model } = mongoose;

const offerSyncItemSchema = new Schema({
  lineNo: { type: Number, required: true },
  product: { type: SchemaTypes.ObjectId, ref: 'Product', required: true },
  action: { type: String, enum: ['UPSERT', 'REMOVE'], required: true },

  offer: { type: SchemaTypes.ObjectId, ref: 'Offer' },
  seller: { type: String },
  price: { type: Number },

  result: { type: String, enum: ['OK', 'ERROR'], default: 'OK' },
  errorCode: { type: String },
  message: { type: String },
}, { _id: false });

const offerSyncBatchSchema = new Schema({
  sellerUser: { type: SchemaTypes.ObjectId, ref: 'User', required: true },

  idempotencyKey: { type: String },

  status: {
    type: String,
    enum: ['ACCEPTED', 'PROCESSING', 'DONE', 'FAILED'],
    default: 'ACCEPTED',
  },

  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  finishedAt: { type: Date },

  items: { type: [offerSyncItemSchema], default: [] },
});

const OfferSyncBatch = model('OfferSyncBatch', offerSyncBatchSchema);
export default OfferSyncBatch;
