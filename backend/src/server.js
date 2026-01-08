import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import initDatabase from './db/init.js';
import Product from './db/model/Product.js';

const HOST = '0.0.0.0';
const PORT = 5172;

const { MONGO_CON_STR } = process.env;

const app = express();
app.use(cors());

app.get('/test', async (req, res) => {
  try {
    const productFound = await Product.findById('507f1f77bcf86cd799439017')
      .populate('categories')
      .populate('offers')
      .exec();

    res.json(productFound);
  } catch (e) {
    res.status(500).json({ msg: 'oopsie whoopsie' });
  }
});

async function main() {
  await mongoose.connect(MONGO_CON_STR);
  await initDatabase();

  app.listen(PORT, HOST, () => {
    console.log(`listening: http://localhost:${PORT}`);
  });
}

main().catch((err) => console.log(err));
