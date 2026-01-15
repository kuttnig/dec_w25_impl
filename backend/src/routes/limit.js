import express from 'express';
import Ajv from 'ajv';
import mongoose from 'mongoose';

import Limit from '../db/model/Limit.js';
import User from '../db/model/User.js';
import Product from '../db/model/Product.js';
import Order from '../db/model/Order.js';

import placeReqSchema from '../schemas/limits/place_limit_req.schema.json' with { type: 'json' };
import placeResSchema from '../schemas/limits/place_limit_res_ack.schema.json' with { type: 'json' };
import statusReqSchema from '../schemas/limits/get_limit_status_req.schema.json' with { type: 'json' };
import statusResSchema from '../schemas/limits/get_limit_status_res.schema.json' with { type: 'json' };

const router = express.Router();
const ajv = new Ajv();

const validatePlaceReq = ajv.compile(placeReqSchema);
const validatePlaceRes = ajv.compile(placeResSchema);
const validateStatusReq = ajv.compile(statusReqSchema);
const validateStatusRes = ajv.compile(statusResSchema);

router.post('/Place', (req, res, next) => {
  if (!validatePlaceReq(req.body)) {
    res.status(400).json({ msg: 'req schema mismatch' });
    return;
  }
  next();
}, async (req, res) => {
  const {userId, prodId, price, validTill} = req.body;

  const limit = new Limit({
      status: 'pending',
      validTill: new Date(validTill),
      price: price,
      product: prodId,
    });
    await limit.save();
  
  const updatedUser = await User.findByIdAndUpdate(
    new mongoose.Types.ObjectId(userId),
    { $push: { limits: limit._id } }
  );

  const limitAck = {limId: String(limit._id), status: limit.status}

  if (!validatePlaceRes(limitAck)) {
    res.status(500).json({ msg: 'res schema mismatch' });
    return;
  }

  res.json(limitAck);
});

router.post('/Status', (req, res, next) => {
  if (!validateStatusReq(req.body)) {
    res.status(400).json({ msg: 'req schema mismatch' });
    return;
  }
  next();
}, async (req, res) => {
  const {limId} = req.body;

  const limit = await Limit.findById(new mongoose.Types.ObjectId(limId));

  const statusRes = {limId, status: limit.status}
  
  if (!validateStatusRes(statusRes)) {
    res.status(500).json({ msg: 'res schema mismatch' });
    return;
  }

  res.json(statusRes);
});

// multiple collection updates should occur as single transaction (not implemented in prototype)
async function processLimitOrders() {
  await Limit.updateMany(
    { status: 'pending', validTill: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );

  const pendingLimits = await Limit.find({ status: 'pending' });
  for (const limit of pendingLimits) {
    const product = await Product.findById(limit.product).populate('offers');
    if (product && product.offers.length > 0) {
      const matchingOffers = product.offers
        .filter(offer => offer.price <= limit.price)
        .sort((a, b) => a.price - b.price);

      if (matchingOffers.length > 0) {
        const matchingOffer = matchingOffers[0];
        
        const order = new Order({
          status: 'pending',
          offer: matchingOffer._id,
        });
        await order.save();

        await User.findOneAndUpdate(
          { limits: limit._id },
          { $push: { orders: order._id } }
        );

        await Limit.findByIdAndUpdate(limit._id, { 
          status: 'fulfilled',
          order: order._id 
        });
      }
    }
  }
}
setInterval(processLimitOrders, 5000);

export default router;
