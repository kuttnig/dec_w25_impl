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
app.use(express.json());

app.post('/products/List', async (req, res) => {
  try {
    // todo: run schema check on req body

    // todo: run graphQL query

    // todo: run schema check on res body

    // todo: rm placeholder
    const productsFound = await Product.find()
      .populate('categories')
      .populate('offers')
      .exec();

    res.json(productsFound);
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
