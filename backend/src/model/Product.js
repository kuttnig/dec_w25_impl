import mongoose from 'mongoose';

const { Schema, SchemaTypes, model } = mongoose;

const productSchema = new Schema({
  name: String,
  description: String,
  categories: [{
    type: SchemaTypes.ObjectId,
    ref: 'Category',
  }],
  offers: [{
    type: SchemaTypes.ObjectId,
    ref: 'Offer',
  }],
});

const Product = model('Product', productSchema);
export default Product;
