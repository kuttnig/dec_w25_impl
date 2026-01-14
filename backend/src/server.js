import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { createHandler } from 'graphql-http/lib/use/express';

import initDatabase from './db/init.js';
import productsRouter from './routes/products.js';
import offerRouter from './routes/offers.js';
import orderRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';

import { schema } from './graphql/schema.js';
import createContext from './graphql/context.js';

const HOST = '0.0.0.0';
const PORT = 5172;

const { MONGO_CON_STR } = process.env;

const app = express();

app.use(cors());
app.use(express.json());

// Rest routes
app.use('/products', productsRouter);
app.use('/offers', offerRouter);
app.use('/orders', orderRouter);
app.use('/admin', adminRouter);

// GraphQL
app.all('/graphql', createHandler({
  schema,
  context: async (req) => createContext(req),
  // just for testing in browser
  graphiql: true,
}));

async function main() {
  await mongoose.connect(MONGO_CON_STR);
  await initDatabase();

  app.listen(PORT, HOST, () => {
    console.log(`listening: http://localhost:${PORT}`);
  });
}

main().catch((err) => console.log(err));
