import crypto from 'crypto';
import fetch from 'node-fetch';

const API_KEY = process.env.BITGET_API_KEY;
const API_SECRET = process.env.BITGET_API_SECRET;
const API_PASSPHRASE = process.env.BITGET_API_PASSPHRASE;

const SYMBOL = 'BTCUSDT_SPBL';
const GRID_LEVELS = 5;
const LOWER_PRICE = 58000;
const UPPER_PRICE = 62000;
const AMOUNT_PER_ORDER = 0.001;
const BASE_URL = 'https://api.bitget.com';

export default async function handler(req, res) {
  try {
    const now = Date.now();
    const timestamp = now.toString();

    await cancelAllOrders(timestamp);

    const gridSpacing = (UPPER_PRICE - LOWER_PRICE) / (GRID_LEVELS - 1);
    const midpoint = (UPPER_PRICE + LOWER_PRICE) / 2;

    for (let i = 0; i < GRID_LEVELS; i++) {
      const price = LOWER_PRICE + i * gridSpacing;
      const side = price < midpoint ? 'buy' : 'sell';
      await placeOrder(price.toFixed(2), side, timestamp);
    }

    res.status(200).json({ message: 'Grid orders placed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

function sign(timestamp, method, path, body = '') {
  const content = timestamp + method + path + body;
  return crypto.createHmac('sha256', API_SECRET).update(content).digest('hex');
}

async function placeOrder(price, side, timestamp) {
  const path = '/api/spot/v1/trade/orders';
  const url = BASE_URL + path;
  const bodyObj = {
    symbol: SYMBOL,
    price,
    size: AMOUNT_PER_ORDER.toString(),
    side,
    orderType: 'limit'
  };
  const body = JSON.stringify(bodyObj);
  const signStr = sign(timestamp, 'POST', path, body);

  const headers = {
    'ACCESS-KEY': API_KEY,
    'ACCESS-SIGN': signStr,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': API_PASSPHRASE,
    'Content-Type': 'application/json'
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body
  });
  const json = await res.json();
  console.log(`[${side.toUpperCase()}] Order @ ${price}:`, json);
}

async function cancelAllOrders(timestamp) {
  const path = '/api/spot/v1/trade/cancel-symbol-order';
  const url = BASE_URL + path;
  const bodyObj = { symbol: SYMBOL };
  const body = JSON.stringify(bodyObj);
  const signStr = sign(timestamp, 'POST', path, body);

  const headers = {
    'ACCESS-KEY': API_KEY,
    'ACCESS-SIGN': signStr,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': API_PASSPHRASE,
    'Content-Type': 'application/json'
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body
  });
  const json = await res.json();
  console.log('[CANCEL ALL] Response:', json);
}
