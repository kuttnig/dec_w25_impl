import express from 'express';
import Ajv from 'ajv';
import mongoose from 'mongoose';

import Limit from '../db/model/Limit.js';
import User from '../db/model/User.js';

import placeReqSchema from '../schemas/limits/place_limit_req.schema.json' with { type: 'json' };
import placeResSchema from '../schemas/limits/place_limit_res_ack.schema.json' with { type: 'json' };

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

export default router;
