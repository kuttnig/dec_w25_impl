import express from 'express';
import Product from '../db/model/Product.js';

const router = express.Router();

router.post('/List', async (req, res) => {
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

export default router;
