import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import Category from './model/Category.js';
import categoriesData from './data/categories.json' with { type: 'json' };

const HOST = '0.0.0.0';
const PORT = 5172;

const { MONGO_CON_STR } = process.env;

const app = express();
app.use(cors());

app.get('/test', async (req, res) => {
  try {
    const categoryFound = await Category.findById(1).exec();  
    res.json(categoryFound);
  } catch (e) {
    res.status(500).json({msg: 'oopsie whoopsie'})
  }
});

async function main() {
  await mongoose.connect(MONGO_CON_STR);

  await Category.deleteMany({});
  await Category.insertMany(categoriesData);

  app.listen(PORT, HOST, () => {
    console.log(`listening: http://localhost:${PORT}`);
  });
}

main().catch((err) => console.log(err));
