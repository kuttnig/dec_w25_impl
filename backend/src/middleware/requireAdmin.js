/**
 * Very small “admin auth” middleware.
 *
 * As discussed (raphael <-> kevin) We keep it intentionally simple for this project:
 * - Frontend sends an admin key in HTTP header: `x-admin-key`
 * - Backend compares it with `process.env.ADMIN_KEY`
 *
 * This protects all /admin routes without building a full user/password system.
 */

export default function requireAdmin(req, res, next) {
  const providedKey = req.header('x-admin-key');
  const expectedKey = process.env.ADMIN_KEY || 'admin';

  if (!providedKey || providedKey !== expectedKey) {
    res.status(401).json({ msg: 'unauthorized' });
    return;
  }

  next();
}
