import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import initDatabase from './db/init.js';
import productsRouter from './routes/products.js';

const HOST = '0.0.0.0';
const PORT = 5172;

const { MONGO_CON_STR } = process.env;

const app = express();

app.use(cors());
app.use(express.json());

app.use('/products', productsRouter);

async function main() {
  await mongoose.connect(MONGO_CON_STR);
  await initDatabase();

  app.listen(PORT, HOST, () => {
    console.log(`listening: http://localhost:${PORT}`);
  });
}

main().catch((err) => console.log(err));
