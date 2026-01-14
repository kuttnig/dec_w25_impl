import express from 'express';
import Ajv from 'ajv';
import mongoose from 'mongoose';

import Order from '../db/model/Order.js';
import User from '../db/model/User.js';

import placeReqSchema from '../schemas/orders/place_order_req.schema.json' with { type: 'json' };
import placeResSchema from '../schemas/orders/place_order_res.schema.json' with { type: 'json' };
import listReqSchema from '../schemas/orders/list_orders_req.schema.json' with { type: 'json' };
import listResSchema from '../schemas/orders/list_orders_res.schema.json' with { type: 'json' };

const router = express.Router();
const ajv = new Ajv();

const validatePlaceReq = ajv.compile(placeReqSchema);
const validatePlaceRes = ajv.compile(placeResSchema);
const validateListReq = ajv.compile(listReqSchema);
const validateListRes = ajv.compile(listResSchema);

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
    res.status(500).json({ msg: 'res schema mismatch' });
    return;
  }

  res.json(orderAck);
});

router.post('/List', (req, res, next) => {
  if (!validateListReq(req.body)) {
    res.status(400).json({ msg: 'req schema mismatch' });
    return;
  }
  next();
}, async (req, res) => {
  const {userId} = req.body;

  let orders = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'orders',
          localField: 'orders',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      {
        $project: {
          _id: 0,
          orders: {
            $map: {
              input: '$orderDetails',
              as: 'order',
              in: {
                orderId: { $toString: '$$order._id' },
                offerId: { $toString: '$$order.offer' },
                status: '$$order.status'
              }
            }
          }
        }
      }
   ]);
  orders = orders[0];
  
  console.log(orders)
  if (!validateListRes(orders)) {
    res.status(500).json({ msg: 'res schema mismatch' });
    return;
  }

  res.json(orders);
});

export default router;
