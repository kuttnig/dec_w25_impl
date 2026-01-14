import Product from '../db/model/Product.js';
import Offer from '../db/model/Offer.js';

import OfferSyncBatch from '../db/model/OfferSyncBatch.js';
import SalesReport from '../db/model/SalesReport.js';

import { processOfferSyncBatch, processSalesReport } from './jobs.js';

function iso(d) { return d ? d.toISOString() : null; }

function ok(payload) { return { ok: true, error: null, ...payload }; }
function fail(code, message, payload = {}) {
  return { ok: false, error: { code, message }, ...payload };
}

function requireB2B(ctx) {
  if (!ctx?.b2bUser) return fail('UNAUTHORIZED', 'missing or invalid x-b2b-key');
  return null;
}

function mapBatch(doc) {
  const items = (doc.items || []).map((it) => ({
    lineNo: it.lineNo,
    productId: it.product?.toString(),
    action: it.action,
    offerId: it.offer ? it.offer.toString() : null,
    seller: it.seller || null,
    price: typeof it.price === 'number' ? it.price : null,
    result: it.result,
    errorCode: it.errorCode || null,
    message: it.message || null,
  }));

  const processedCount = items.length;
  const successCount = items.filter((i) => i.result === 'OK').length;
  const errorCount = processedCount - successCount;

  return {
    id: doc._id.toString(),
    status: doc.status,
    createdAt: iso(doc.createdAt),
    startedAt: iso(doc.startedAt),
    finishedAt: iso(doc.finishedAt),
    idempotencyKey: doc.idempotencyKey || null,
    sellerUserId: doc.sellerUser.toString(),
    summary: { processedCount, successCount, errorCount },
    items,
  };
}

function mapReport(doc) {
  return {
    id: doc._id.toString(),
    status: doc.status,
    from: iso(doc.from),
    to: iso(doc.to),
    format: doc.format,
    createdAt: iso(doc.createdAt),
    startedAt: iso(doc.startedAt),
    finishedAt: iso(doc.finishedAt),
    receivedAt: iso(doc.receivedAt),
    totals: doc.totals ? { orderCount: doc.totals.orderCount, revenue: doc.totals.revenue } : null,
    message: doc.message || null,
  };
}

export default {
  Query: {
    products: async (_, { limit }) => {
      const products = await Product.find({})
        .limit(Math.min(limit || 50, 200))
        .populate('categories', 'name description')
        .populate('offers', 'seller price')
        .sort({ name: 1 });

      return products.map((p) => ({
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
      }));
    },

    offers: async (_, { productId }) => {
      const product = await Product.findById(productId).populate('offers', 'seller price');
      if (!product) return [];
      return (product.offers || []).map((o) => ({
        id: o._id.toString(),
        seller: o.seller,
        price: o.price,
      }));
    },

    b2bMe: async (_, __, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return null;

      return {
        userId: ctx.b2bUser._id.toString(),
        name: ctx.b2bUser.name,
        companyName: ctx.companyName,
      };
    },

    // -----------------------------
    // B2B-3 (Raphael)
    // -----------------------------
    offerSyncBatchStatus: async (_, { batchId }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return { ...authErr, batchId };

      const batch = await OfferSyncBatch.findById(batchId);
      if (!batch) return fail('NOT_FOUND', 'batch not found', { batchId });

      if (batch.sellerUser.toString() !== ctx.b2bUser._id.toString()) {
        return fail('FORBIDDEN', 'batch belongs to another seller', { batchId });
      }

      return ok({
        batchId,
        status: batch.status,
        startedAt: iso(batch.startedAt),
        finishedAt: iso(batch.finishedAt),
      });
    },

    offerSyncBatchResult: async (_, { batchId }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return authErr;

      const batch = await OfferSyncBatch.findById(batchId);
      if (!batch) return fail('NOT_FOUND', 'batch not found');

      if (batch.sellerUser.toString() !== ctx.b2bUser._id.toString()) {
        return fail('FORBIDDEN', 'batch belongs to another seller');
      }

      return ok({ batch: mapBatch(batch) });
    },

    offerSyncBatches: async (_, { limit }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return [];

      const docs = await OfferSyncBatch.find({ sellerUser: ctx.b2bUser._id })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit || 20, 200));

      return docs.map(mapBatch);
    },

    // -----------------------------
    // B2B-4 (Raphael)
    // -----------------------------
    salesReportStatus: async (_, { reportId }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return { ...authErr, reportId };

      const report = await SalesReport.findById(reportId);
      if (!report) return fail('NOT_FOUND', 'report not found', { reportId });

      if (report.sellerUser.toString() !== ctx.b2bUser._id.toString()) {
        return fail('FORBIDDEN', 'report belongs to another seller', { reportId });
      }

      return ok({
        reportId,
        status: report.status,
        message: report.message || null,
      });
    },

    salesReport: async (_, { reportId, page, pageSize }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return authErr;

      const report = await SalesReport.findById(reportId);
      if (!report) return fail('NOT_FOUND', 'report not found');

      if (report.sellerUser.toString() !== ctx.b2bUser._id.toString()) {
        return fail('FORBIDDEN', 'report belongs to another seller');
      }

      const p = Math.max(1, page || 1);
      const ps = Math.min(Math.max(1, pageSize || 50), 200);

      const totalItems = (report.lines || []).length;
      const totalPages = Math.max(1, Math.ceil(totalItems / ps));
      const start = (p - 1) * ps;
      const end = start + ps;

      const slice = (report.lines || []).slice(start, end).map((l) => ({
        lineNo: l.lineNo,
        orderId: l.order.toString(),
        createdAt: iso(l.createdAt),
        offerId: l.offer.toString(),
        productId: l.product ? l.product.toString() : null,
        productName: l.productName || null,
        seller: l.seller || null,
        price: typeof l.price === 'number' ? l.price : null,
      }));

      return ok({
        page: {
          report: mapReport(report),
          pageInfo: { page: p, pageSize: ps, totalItems, totalPages },
          lines: slice,
        },
      });
    },

    salesReports: async (_, { limit }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return [];

      const docs = await SalesReport.find({ sellerUser: ctx.b2bUser._id })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit || 20, 200));

      return docs.map(mapReport);
    },
  },

  Mutation: {
    // -----------------------------
    // B2B-3 (Raphael)
    // -----------------------------
    submitOfferSyncBatch: async (_, { input }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return authErr;

      const items = Array.isArray(input?.items) ? input.items : [];
      if (items.length === 0) return fail('INVALID_INPUT', 'items must not be empty');
      if (items.length > 200) return fail('BATCH_TOO_LARGE', 'max 200 items per batch');

      // idempotency check
      const idem = (input.idempotencyKey || '').trim();
      if (idem) {
        const existing = await OfferSyncBatch.findOne({
          sellerUser: ctx.b2bUser._id,
          idempotencyKey: idem,
        });
        if (existing) {
          return ok({ batchId: existing._id.toString(), status: existing.status });
        }
      }

      // validate product IDs exist in DB quickly
      const uniqueProdIds = [...new Set(items.map((it) => it.productId))];
      const products = await Product.find({ _id: { $in: uniqueProdIds } }, { _id: 1 });
      const existingProd = new Set(products.map((p) => p._id.toString()));

      // build batch items
      const batchItems = items.map((it, idx) => ({
        lineNo: it.lineNo || (idx + 1),
        product: it.productId,
        action: it.action,
        offer: it.offerId || undefined,
        seller: (it.seller || ctx.companyName || '').trim(),
        price: typeof it.price === 'number' ? it.price : undefined,
        result: existingProd.has(it.productId) ? 'OK' : 'ERROR',
        errorCode: existingProd.has(it.productId) ? undefined : 'NOT_FOUND',
        message: existingProd.has(it.productId) ? undefined : 'product not found',
      }));

      const batch = await OfferSyncBatch.create({
        sellerUser: ctx.b2bUser._id,
        idempotencyKey: idem || undefined,
        status: 'ACCEPTED',
        items: batchItems,
      });

      // async processing 
      setTimeout(() => {
        processOfferSyncBatch(batch._id.toString()).catch(() => {});
      }, 150);

      return ok({ batchId: batch._id.toString(), status: batch.status });
    },

    // -----------------------------
    // B2B-4 (Raphael)
    // -----------------------------
    requestSalesReport: async (_, { input }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return authErr;

      const from = new Date(input.from);
      const to = new Date(input.to);

      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return fail('INVALID_INPUT', 'from/to must be valid ISO dates');
      }
      if (from > to) return fail('INVALID_INPUT', 'from must be <= to');

      // 90 days limit
      const ms90d = 90 * 24 * 60 * 60 * 1000;
      if (to.getTime() - from.getTime() > ms90d) {
        return fail('RANGE_TOO_LARGE', 'max date range is 90 days');
      }

      const idem = (input.idempotencyKey || '').trim();
      if (idem) {
        const existing = await SalesReport.findOne({
          sellerUser: ctx.b2bUser._id,
          idempotencyKey: idem,
        });
        if (existing) {
          return ok({ reportId: existing._id.toString(), status: existing.status });
        }
      }

      const report = await SalesReport.create({
        sellerUser: ctx.b2bUser._id,
        idempotencyKey: idem || undefined,
        from,
        to,
        format: input.format || 'JSON',
        status: 'QUEUED',
      });

      setTimeout(() => {
        processSalesReport(report._id.toString(), ctx.companyName).catch(() => {});
      }, 200);

      return ok({ reportId: report._id.toString(), status: report.status });
    },

    confirmSalesReportReceived: async (_, { reportId }, ctx) => {
      const authErr = requireB2B(ctx);
      if (authErr) return authErr;

      const report = await SalesReport.findById(reportId);
      if (!report) return fail('NOT_FOUND', 'report not found');
      if (report.sellerUser.toString() !== ctx.b2bUser._id.toString()) {
        return fail('FORBIDDEN', 'report belongs to another seller');
      }

      report.receivedAt = new Date();
      await report.save();

      return ok({});
    },
  },
};
