
import Category from './model/Category.js';
import Offer from './model/Offer.js';
import Product from './model/Product.js';
import User from './model/User.js';
import Order from './model/Order.js';
import Limit from './model/Limit.js';

import categoryData from './data/categories.json' with { type: 'json' };
import offerData from './data/offers.json' with { type: 'json' };
import productData from './data/products.json' with { type: 'json' };
import userData from './data/users.json' with { type: 'json' };

export default async function initDatabase() {
  await Category.deleteMany({});
  await Category.insertMany(categoryData);

  await Offer.deleteMany({});
  await Offer.insertMany(offerData);

  await Product.deleteMany({});
  await Product.insertMany(productData);

  await User.deleteMany({});
  await User.insertMany(userData);

  await Order.deleteMany({});

  await Limit.deleteMany({});
}