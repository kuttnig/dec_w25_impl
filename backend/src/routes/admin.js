import express from 'express';

import requireAdmin from '../middleware/requireAdmin.js';

import User from '../db/model/User.js';
import Category from '../db/model/Category.js';
import Product from '../db/model/Product.js';
import Offer from '../db/model/Offer.js';
import Order from '../db/model/Order.js';
import Limit from '../db/model/Limit.js';

const router = express.Router();

// Protect EVERYTHING under /admin.
router.use(requireAdmin);

// -----------------------------
// Overview
// -----------------------------
router.get('/overview', async (req, res) => {
  const [
    userCount,
    businessUserCount,
    productCount,
    offerCount,
    orderCount,
    limitCount,
    categoryCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isBusiness: true }),
    Product.countDocuments(),
    Offer.countDocuments(),
    Order.countDocuments(),
    Limit.countDocuments(),
    Category.countDocuments(),
  ]);

  res.json({
    users: {
      total: userCount,
      business: businessUserCount,
      customers: userCount - businessUserCount,
    },
    catalog: {
      categories: categoryCount,
      products: productCount,
      offers: offerCount,
    },
    transactions: {
      orders: orderCount,
      limits: limitCount,
    },
  });
});

// -----------------------------
// Users
// -----------------------------

router.get('/users', async (req, res) => {
  const users = await User.find({}, { name: 1, isBusiness: 1 }).sort({ name: 1 });
  res.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      isBusiness: !!u.isBusiness,
    })),
  });
});

router.post('/users', async (req, res) => {
  const { name, isBusiness } = req.body || {};

  if (!name || typeof name !== 'string') {
    res.status(400).json({ msg: 'name is required' });
    return;
  }

  const user = await User.create({
    name: name.trim(),
    isBusiness: !!isBusiness,
  });

  res.status(201).json({
    user: {
      id: user._id.toString(),
      name: user.name,
      isBusiness: !!user.isBusiness,
    },
  });
});

router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, isBusiness } = req.body || {};

  const update = {};
  if (typeof name === 'string') update.name = name.trim();
  if (typeof isBusiness === 'boolean') update.isBusiness = isBusiness;

  const user = await User.findByIdAndUpdate(id, update, { new: true });
  if (!user) {
    res.status(404).json({ msg: 'user not found' });
    return;
  }

  res.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      isBusiness: !!user.isBusiness,
    },
  });
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    res.status(404).json({ msg: 'user not found' });
    return;
  }

  res.json({ ok: true });
});

// -----------------------------
// Categories
// -----------------------------

router.get('/categories', async (req, res) => {
  const categories = await Category.find({}, { name: 1, description: 1 }).sort({ name: 1 });
  res.json({
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      description: c.description,
    })),
  });
});

router.post('/categories', async (req, res) => {
  const { name, description } = req.body || {};
  if (!name || typeof name !== 'string') {
    res.status(400).json({ msg: 'name is required' });
    return;
  }
  const cat = await Category.create({
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : '',
  });
  res.status(201).json({
    category: {
      id: cat._id.toString(),
      name: cat.name,
      description: cat.description,
    },
  });
});

router.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  const cat = await Category.findByIdAndDelete(id);
  if (!cat) {
    res.status(404).json({ msg: 'category not found' });
    return;
  }
  res.json({ ok: true });
});

// -----------------------------
// Products + Offers
// -----------------------------

router.get('/products', async (req, res) => {
  const products = await Product.find({})
    .populate('categories', 'name description')
    .populate('offers', 'seller price')
    .sort({ name: 1 });

  res.json({
    products: products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      categories: (p.categories || []).map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.description,
      })),
      offers: (p.offers || []).map((o) => ({
        id: o._id.toString(),
        seller: o.seller,
        price: o.price,
      })),
    })),
  });
});

router.post('/products', async (req, res) => {
  const { name, description, categoryIds } = req.body || {};

  if (!name || typeof name !== 'string') {
    res.status(400).json({ msg: 'name is required' });
    return;
  }

  const categories = Array.isArray(categoryIds) ? categoryIds : [];

  const product = await Product.create({
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    categories,
    offers: [],
  });

  res.status(201).json({
    product: {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
    },
  });
});

router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    res.status(404).json({ msg: 'product not found' });
    return;
  }

  // Clean up offers referenced by the product (optional but keeps imo our DB tidy, which is nice :) ).
  const offerIds = product.offers || [];
  await Promise.all([
    Offer.deleteMany({ _id: { $in: offerIds } }),
    Product.findByIdAndDelete(id),
  ]);

  res.json({ ok: true });
});

router.post('/products/:productId/offers', async (req, res) => {
  const { productId } = req.params;
  const { seller, price } = req.body || {};

  if (!seller || typeof seller !== 'string') {
    res.status(400).json({ msg: 'seller is required' });
    return;
  }
  if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
    res.status(400).json({ msg: 'price must be a positive number' });
    return;
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404).json({ msg: 'product not found' });
    return;
  }

  const offer = await Offer.create({
    seller: seller.trim(),
    price,
  });

  product.offers = product.offers || [];
  product.offers.push(offer._id);
  await product.save();

  res.status(201).json({
    offer: {
      id: offer._id.toString(),
      seller: offer.seller,
      price: offer.price,
    },
  });
});

router.delete('/products/:productId/offers/:offerId', async (req, res) => {
  const { productId, offerId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404).json({ msg: 'product not found' });
    return;
  }

  product.offers = (product.offers || []).filter((id) => id.toString() !== offerId);
  await product.save();
  await Offer.findByIdAndDelete(offerId);

  res.json({ ok: true });
});

export default router;
