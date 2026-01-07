import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const HOST = '0.0.0.0';
const PORT = 5172;

const { MONGO_CON_STR } = process.env;

const app = express();
app.use(cors());

app.get('/test', (req, res) => {
  res.json({ msg: 'goodbye from backend' });
});

async function main() {
  await mongoose.connect(MONGO_CON_STR);
  console.log('Goose 🪿 connected');

  app.listen(PORT, HOST, () => {
    console.log(`listening: http://localhost:${PORT}`);
  });
}

main().catch((err) => console.log(err));
