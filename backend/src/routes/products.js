import express from 'express';
import Ajv from 'ajv';

import Product from '../db/model/Product.js';

import listReqSchema from '../schemas/products/list_products_req.schema.json' with { type: 'json' };
import listResSchema from '../schemas/products/list_products_res.schema.json' with { type: 'json' };

const router = express.Router();
const ajv = new Ajv();

const validateListReq = ajv.compile(listReqSchema);
const validateListRes = ajv.compile(listResSchema);

router.post('/List', (req, res, next) => {
  if (!validateListReq(req.body)) {
    res.status(400).json({ msg: 'req schema mismatch' });
    return;
  }
  next();
}, async (req, res) => {
  let productList = await Product.aggregate([
    {
      $project: {
        _id: 0,
        prodId: { $toString: '$_id' },
        name: 1,
        description: 1,
      }
    }
  ]);
  productList = {products: productList}

  if (!validateListRes(productList)) {
    res.status(500).json({ msg: 'res schema mismatch' });
    return;
  }
  res.json(productList);
});

export default router;
