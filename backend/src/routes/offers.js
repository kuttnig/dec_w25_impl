import express from 'express';
import Ajv from 'ajv';

import Offer from '../db/model/Offer.js';
import Product from '../db/model/Product.js';

import listReqSchema from '../schemas/offers/list_offers_req.schema.json' with { type: 'json' };
import listResSchema from '../schemas/offers/list_offers_res.schema.json' with { type: 'json' };

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
  const { prodId } = req.body;
  const product = await Product.findById(prodId).lean();

  let offerList = await Offer.aggregate([
    { $match: { _id: { $in: product.offers } } },
    {
      $project: {
        _id: 0,
        offerId: { $toString: '$_id' },
        seller: 1,
        price: 1,
      }
    }
  ]);
  offerList = {offers: offerList}

  if (!validateListRes(offerList)) {
    res.status(500).json({ msg: 'res schema mismatch' });
    return;
  }
  res.json(offerList);
});

export default router;
