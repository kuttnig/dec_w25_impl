import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const offerSchema = new Schema({
  price: Number,
  seller: String,
});

const Offer = model('Offer', offerSchema);
export default Offer;
