import mongoose from 'mongoose';

const { Schema, SchemaTypes, model } = mongoose;

const salesReportLineSchema = new Schema({
  lineNo: { type: Number, required: true },
  order: { type: SchemaTypes.ObjectId, ref: 'Order', required: true },
  createdAt: { type: Date, required: true },

  offer: { type: SchemaTypes.ObjectId, ref: 'Offer', required: true },
  product: { type: SchemaTypes.ObjectId, ref: 'Product' },
  productName: { type: String },

  seller: { type: String },
  price: { type: Number },
}, { _id: false });

const salesReportSchema = new Schema({
  sellerUser: { type: SchemaTypes.ObjectId, ref: 'User', required: true },

  idempotencyKey: { type: String },

  status: {
    type: String,
    enum: ['QUEUED', 'RUNNING', 'READY', 'FAILED'],
    default: 'QUEUED',
  },

  from: { type: Date, required: true },
  to: { type: Date, required: true },

  format: { type: String, enum: ['JSON', 'CSV'], default: 'JSON' },

  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  finishedAt: { type: Date },

  receivedAt: { type: Date },
  message: { type: String },

  totals: {
    orderCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },

  lines: { type: [salesReportLineSchema], default: [] },
});

const SalesReport = model('SalesReport', salesReportSchema);
export default SalesReport;
