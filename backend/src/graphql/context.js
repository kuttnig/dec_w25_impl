import User from '../db/model/User.js';

function getHeader(reqLike, name) {
  const req = reqLike?.req || reqLike?.request || reqLike;
  const key = name.toLowerCase();

  if (req?.headers && typeof req.headers.get === 'function') {
    return req.headers.get(name) || req.headers.get(key) || '';
  }

  if (typeof req?.header === 'function') return req.header(name) || '';
  if (typeof req?.get === 'function') return req.get(name) || '';

  if (req?.headers && typeof req.headers === 'object') {
    const v = req.headers[key];
    if (Array.isArray(v)) return v[0] || '';
    return v || '';
  }

  return '';
}

export default async function createContext(reqLike) {
  const b2bKey = getHeader(reqLike, 'x-b2b-key');

  let b2bUser = null;
  if (b2bKey) {
    b2bUser = await User.findOne({
      isBusiness: true,
      b2bApiKey: b2bKey,
    });
  }

  const companyName = (b2bUser?.companyName || b2bUser?.name || '').trim();

  return {
    b2bUser,
    companyName,
  };
}
