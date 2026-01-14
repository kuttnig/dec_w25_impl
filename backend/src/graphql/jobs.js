import OfferSyncBatch from '../db/model/OfferSyncBatch.js';
import SalesReport from '../db/model/SalesReport.js';

import Product from '../db/model/Product.js';
import Offer from '../db/model/Offer.js';
import Order from '../db/model/Order.js';

function now() { return new Date(); }

export async function processOfferSyncBatch(batchId) {
  const batch = await OfferSyncBatch.findById(batchId);
  if (!batch) return;

  // if not in ACCEPTED state we ignore to prevent double processing
  if (batch.status !== 'ACCEPTED') return;

  batch.status = 'PROCESSING';
  batch.startedAt = now();
  await batch.save();

  try {
    const productIds = [...new Set(batch.items.map((it) => it.product.toString()))];
    const products = await Product.find({ _id: { $in: productIds } });

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (const item of batch.items) {
      const prod = productMap.get(item.product.toString());
      if (!prod) {
        item.result = 'ERROR';
        item.errorCode = 'NOT_FOUND';
        item.message = 'product not found';
        continue;
      }

      if (item.action === 'UPSERT') {
        if (!item.price || item.price <= 0) {
          item.result = 'ERROR';
          item.errorCode = 'INVALID_INPUT';
          item.message = 'price must be > 0 for UPSERT';
          continue;
        }

        if (item.offer) {
          // update existing offer
          const offer = await Offer.findById(item.offer);
          if (!offer) {
            item.result = 'ERROR';
            item.errorCode = 'NOT_FOUND';
            item.message = 'offer not found';
            continue;
          }

          offer.price = item.price;
          if (item.seller) offer.seller = item.seller;
          await offer.save();

          item.result = 'OK';
          item.message = 'offer updated';
        } else {
          // create new offer und attach to product
          const offer = await Offer.create({
            seller: item.seller,
            price: item.price,
          });

          prod.offers = prod.offers || [];
          prod.offers.push(offer._id);
          await prod.save();

          item.offer = offer._id;
          item.result = 'OK';
          item.message = 'offer created';
        }
      } else if (item.action === 'REMOVE') {
        if (!item.offer) {
          item.result = 'ERROR';
          item.errorCode = 'INVALID_INPUT';
          item.message = 'offerId is required for REMOVE';
          continue;
        }

        // remove offer from product and delete offer
        prod.offers = (prod.offers || []).filter((id) => id.toString() !== item.offer.toString());
        await prod.save();
        await Offer.findByIdAndDelete(item.offer);

        item.result = 'OK';
        item.message = 'offer removed';
      } else {
        item.result = 'ERROR';
        item.errorCode = 'INVALID_INPUT';
        item.message = 'invalid action';
      }
    }

    batch.status = 'DONE';
    batch.finishedAt = now();
    await batch.save();
  } catch (e) {
    batch.status = 'FAILED';
    batch.finishedAt = now();
    await batch.save();
  }
}

export async function processSalesReport(reportId, sellerName) {
  const report = await SalesReport.findById(reportId);
  if (!report) return;
  if (report.status !== 'QUEUED') return;

  report.status = 'RUNNING';
  report.startedAt = now();
  await report.save();

  try {
    const orders = await Order.find({
      createdAt: { $gte: report.from, $lte: report.to },
    }).populate('offer');

    // filtr by seller name
    const sellerOrders = orders.filter((o) => o.offer && o.offer.seller === sellerName);

    const offerIds = sellerOrders
      .map((o) => o.offer?._id)
      .filter(Boolean);

    // map offerId -> product
    const products = await Product.find({ offers: { $in: offerIds } }, { name: 1, offers: 1 });
    const offerToProduct = new Map();
    for (const p of products) {
      for (const offId of (p.offers || [])) {
        offerToProduct.set(offId.toString(), { id: p._id.toString(), name: p.name });
      }
    }

    let revenue = 0;
    const lines = sellerOrders.map((o, idx) => {
      const offer = o.offer;
      const prod = offerToProduct.get(offer._id.toString());
      const price = Number(offer.price || 0);
      revenue += price;

      return {
        lineNo: idx + 1,
        order: o._id,
        createdAt: o.createdAt,
        offer: offer._id,
        product: prod ? prod.id : undefined,
        productName: prod ? prod.name : undefined,
        seller: offer.seller,
        price,
      };
    });

    report.lines = lines;
    report.totals = {
      orderCount: lines.length,
      revenue,
    };

    report.status = 'READY';
    report.finishedAt = now();
    await report.save();
  } catch (e) {
    report.status = 'FAILED';
    report.message = 'report generation failed';
    report.finishedAt = now();
    await report.save();
  }
}
