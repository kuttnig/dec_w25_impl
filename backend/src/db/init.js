
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
  // Info by Raphael:
  // IMPORTANT for development:
  // With nodemon the backend restarts often. If we ALWAYS delete+insert,
  // every code change would wipe the DB and you would lose created data.
  //
  // Behaviour:
  // - If RESET_DB=true: wipe & re-seed everything (deterministic demo data)
  // - Otherwise: seed only when the collection is empty
  const reset = (process.env.RESET_DB || '').toLowerCase() === 'true';

  if (reset) {
    await Category.deleteMany({});
    await Offer.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Limit.deleteMany({});

    await Category.insertMany(categoryData);
    await Offer.insertMany(offerData);
    await Product.insertMany(productData);
    await User.insertMany(userData);
    return;
  }

  // Seed only if empty
  if (await Category.countDocuments() === 0) {
    await Category.insertMany(categoryData);
  }
  if (await Offer.countDocuments() === 0) {
    await Offer.insertMany(offerData);
  }
  if (await Product.countDocuments() === 0) {
    await Product.insertMany(productData);
  }
  if (await User.countDocuments() === 0) {
    await User.insertMany(userData);
  }
}
