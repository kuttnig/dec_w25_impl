import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const categorySchema = new Schema({
  _id: Number,
  name: String,
  description: String,
});

const Category = model('Category', categorySchema);
export default Category;
