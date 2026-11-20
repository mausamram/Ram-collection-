const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

// Keep this catalogue on the server. Never trust prices sent by the browser.
const catalogue = {
  1: 799, 2: 1299, 3: 1499, 4: 1799,
  5: 1099, 6: 999, 7: 1399, 8: 1599,
  9: 1999, 10: 1199, 11: 399, 12: 799,
  13: 1899, 14: 1699, 15: 699, 16: 599
};


app.post('/api/create-cod-order', (req, res) => {
  try {
    const items = req.body.items;
    const customer = req.body.customer || {};
    const name = String(customer.name || '').trim();
    const phone = String(customer.phone || '').trim();
    const address = String(customer.address || '').trim();
    if (name.length < 2 || name.length > 80 || !/^[6-9]\d{9}$/.test(phone) || address.length < 10 || address.length > 250) {
      return res.status(400).json({ error: 'Please provide a valid name, 10-digit Indian mobile number and complete delivery address.' });
    }
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Cart is empty.' });
    let totalRupees = 0;
    const safeItems = [];
    for (const item of items) {
      const price = catalogue[item.id], qty = Number(item.qty);
      if (!price || !Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ error: 'Invalid cart item.' });
      totalRupees += price * qty;
      safeItems.push({ id: Number(item.id), qty, unitPrice: price });
    }
    if (totalRupees < 1 || totalRupees > 100000) return res.status(400).json({ error: 'Order amount is outside the allowed range.' });
    const orderId = `RAM-COD-${Date.now()}`;
    const record = { orderId, paymentMethod: 'COD', paymentStatus: 'Pending - Cash on Delivery',
      customer: { name, phone, address }, items: safeItems, totalRupees, createdAt: new Date().toISOString() };
    const file = path.join(__dirname, 'orders.json');
    let orders = [];
    try { orders = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) {}
    if (!Array.isArray(orders)) orders = [];
    orders.push(record);
    fs.writeFileSync(file, JSON.stringify(orders, null, 2), { mode: 0o600 });
    res.status(201).json({ orderId, totalRupees });
  } catch (error) {
    console.error('COD order creation failed:', error.message);
    res.status(500).json({ error: 'Could not place COD order.' });
  }
});

app.post('/api/create-order', async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ error: 'Payment gateway is not configured.' });
    const items = req.body.items;
    const customer = req.body.customer || {};
    const name = String(customer.name || '').trim();
    const phone = String(customer.phone || '').trim();
    const address = String(customer.address || '').trim();
    if (name.length < 2 || name.length > 80 || !/^[6-9]\d{9}$/.test(phone) || address.length < 10 || address.length > 250) {
      return res.status(400).json({ error: 'Please provide a valid name, 10-digit Indian mobile number and complete delivery address.' });
    }
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Cart is empty.' });
    let totalRupees = 0;
    for (const item of items) {
      const price = catalogue[item.id];
      const qty = Number(item.qty);
      if (!price || !Number.isInteger(qty) || qty < 1 || qty > 10) {
        return res.status(400).json({ error: 'Invalid cart item.' });
      }
      totalRupees += price * qty;
    }
    if (totalRupees < 1 || totalRupees > 100000) return res.status(400).json({ error: 'Order amount is outside the allowed range.' });
    const order = await razorpay.orders.create({
      amount: totalRupees * 100,
      currency: 'INR',
      receipt: `ram_${Date.now()}`,
      notes: { store: 'Ram.collection', customer_name: name, customer_phone: phone, delivery_address: address }
    });
    res.json({ id: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Order creation failed:', error.message);
    res.status(500).json({ error: 'Could not create payment order.' });
  }
});

app.post('/api/verify-payment', (req, res) => {
  try {
    if (!RAZORPAY_KEY_SECRET) return res.status(503).json({ error: 'Payment gateway is not configured.' });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment verification fields.' });
    }
    const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(razorpay_signature, 'hex');
    const verified = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!verified) return res.status(400).json({ verified: false });
    // Production stores should also persist the order and confirm captured status via API/webhook.
    res.json({ verified: true });
  } catch (error) {
    console.error('Payment verification failed:', error.message);
    res.status(500).json({ verified: false, error: 'Could not verify payment.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Ram.collection running on port ${port}`));
