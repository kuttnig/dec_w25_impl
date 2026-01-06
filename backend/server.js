import express from 'express';
import cors from 'cors';

const HOST = process.env.NODE_ENV === 'docker' ? '0.0.0.0' : 'localhost';
const PORT = 5172;

const app = express();
app.use(cors());

app.get('/test', (req, res) => {
  res.json({ msg: 'hello from backend' });
});

app.listen(PORT, HOST, () => {
  console.log(`listening: http://localhost:${PORT}`);
});
