import express from 'express';
import cors from 'cors';

const PORT = 5172;

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('bar');
});

app.listen(PORT, () => {
  console.log(`listening: http://localhost:${PORT}`);
});
