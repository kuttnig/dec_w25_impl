import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import Category from './model/Category.js';
import categoryData from './data/categories.json' with { type: 'json' };

import Offer from './model/Offer.js';
import offerData from './data/offers.json' with { type: 'json' };

import Product from './model/Product.js';
import productData from './data/products.json' with { type: 'json' };

const HOST = '0.0.0.0';
const PORT = 5172;

const { MONGO_CON_STR } = process.env;

const app = express();
app.use(cors());

app.get('/test', async (req, res) => {
  try {
    const productFound = await Product.findById("507f1f77bcf86cd799439016")
    .populate('categories')
    .populate('offers')
    .exec();

    res.json(productFound);
  } catch (e) {
    res.status(500).json({msg: 'oopsie whoopsie'})
  }
});

async function main() {
  await mongoose.connect(MONGO_CON_STR);

  await Category.deleteMany({});
  await Category.insertMany(categoryData);

  await Offer.deleteMany({});
  await Offer.insertMany(offerData);

  await Product.deleteMany({});
  await Product.insertMany(productData);

  app.listen(PORT, HOST, () => {
    console.log(`listening: http://localhost:${PORT}`);
  });
}

main().catch((err) => console.log(err));
