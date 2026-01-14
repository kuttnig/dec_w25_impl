import express from 'express';
import Ajv from 'ajv';
import mongoose from 'mongoose';

import Order from '../db/model/Order.js';
import User from '../db/model/User.js';

import placeReqSchema from '../schemas/orders/place_order_req.schema.json' with { type: 'json' };
import placeResSchema from '../schemas/orders/place_order_res.schema.json' with { type: 'json' };

const router = express.Router();
const ajv = new Ajv();

const validatePlaceReq = ajv.compile(placeReqSchema);
const validatePlaceRes = ajv.compile(placeResSchema);

router.post('/Place', (req, res, next) => {
  if (!validatePlaceReq(req.body)) {
    res.status(400).json({ msg: 'req schema mismatch' });
    return;
  }
  next();
}, async (req, res) => {
  const {userId, offerId} = req.body;

  const order = new Order({
    status: 'pending',
    offer: offerId,
  });
  await order.save();

  const updatedUser = await User.findByIdAndUpdate(
    new mongoose.Types.ObjectId(userId),
    { $push: { orders: order._id } }
  );
  

  const orderAck = {orderId: String(order._id), status: order.status, createdAt: String(order.createdAt)}

  if (!validatePlaceRes(orderAck)) {
    console.error(validatePlaceRes.errors);
    res.status(500).json({ msg: 'res schema mismatch' });
    return;
  }

  res.json(orderAck);
});

export default router;
