
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const os = require("os");
require("dotenv").config();

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

// Never expose private server and order files.
const blockedFiles = new Set([
  "/server.js",
  "/package.json",
  "/package-lock.json",
  "/orders.json",
  "/.env"
]);

app.use((req, res, next) => {
  if (blockedFiles.has(req.path)) {
    return res.sendStatus(404);
  }
  next();
});

app.use(express.static(__dirname, {
  dotfiles: "deny",
  index: "index.html"
}));

const PORT = process.env.PORT || 3000;
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = KEY_ID && KEY_SECRET
  ? new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET
    })
  : null;

// Prices verified against the 31 products in index.html.
const catalogue = {
  1: 799,
  2: 1299,
  3: 1499,
  4: 1799,
  5: 1099,
  6: 999,
  7: 1399,
  8: 1599,
  9: 1999,
  10: 1199,
  11: 399,
  12: 799,
  13: 1899,
  14: 1699,
  15: 699,
  16: 599,
  17: 899,
  18: 1499,
  19: 1599,
  20: 1199,
  21: 1299,
  22: 1899,
  23: 1099,
  24: 1999,
  25: 1599,
  26: 999,
  27: 1199,
  28: 1499,
  29: 499,
  30: 499,
  31: 699
};

// Private temporary order storage.
// For permanent production storage, connect a private database.
const ordersFile =
  process.env.ORDERS_FILE ||
  path.join(os.tmpdir(), "ram-collection-orders.json");

function validateCustomer(customer = {}) {
  const name = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();
  const address = String(customer.address || "").trim();

  if (name.length < 2 || name.length > 80) {
    throw new Error("Please enter a valid customer name.");
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }

  if (address.length < 10 || address.length > 250) {
    throw new Error("Please enter a complete delivery address.");
  }

  return { name, phone, address };
}

function calculateOrder(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 31) {
    throw new Error("Your cart is empty or invalid.");
  }

  let total = 0;
  const safeItems = [];
  const seen = new Set();

  for (const item of items) {
    const id = Number(item.id);
    const qty = Number(item.qty);
    const price = catalogue[id];

    if (
      !Number.isInteger(id) ||
      !price ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 10 ||
      seen.has(id)
    ) {
      throw new Error("Invalid product or quantity in your cart.");
    }

    seen.add(id);
    total += price * qty;

    safeItems.push({
      id,
      qty,
      unitPrice: price
    });
  }

  if (total < 1 || total > 100000) {
    throw new Error("Order amount is outside the allowed range.");
  }

  return { total, safeItems };
}

function savePrivateOrder(record) {
  let orders = [];

  try {
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    }
  } catch (error) {
    console.error("Could not read order file:", error.message);
    throw new Error("Order storage is temporarily unavailable.");
  }

  if (!Array.isArray(orders)) {
    throw new Error("Order storage is invalid.");
  }

  orders.push(record);

  fs.mkdirSync(path.dirname(ordersFile), { recursive: true });
  fs.writeFileSync(
    ordersFile,
    JSON.stringify(orders, null, 2),
    { mode: 0o600 }
  );
}

// Cash on Delivery
app.post("/api/create-cod-order", (req, res) => {
  try {
    const customer = validateCustomer(req.body.customer);
    const { total, safeItems } = calculateOrder(req.body.items);

    const orderId = "RAM-COD-" + crypto.randomUUID();

    const record = {
      orderId,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      customer,
      items: safeItems,
      totalRupees: total,
      createdAt: new Date().toISOString()
    };

    savePrivateOrder(record);

    return res.status(201).json({
      success: true,
      orderId,
      totalRupees: total
    });
  } catch (error) {
    console.error("COD order error:", error.message);

    return res.status(400).json({
      error: error.message || "Could not place COD order."
    });
  }
});

// Create Razorpay online payment order
app.post("/api/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        error: "Online payment is not configured yet."
      });
    }

    const customer = validateCustomer(req.body.customer);
    const { total, safeItems } = calculateOrder(req.body.items);

    const order = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: "ram_" + Date.now(),
      notes: {
        store: "RAM COLLECTION",
        product_count: String(safeItems.length)
      }
    });

    return res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID
    });
  } catch (error) {
    console.error("Payment order error:", error.message);

    return res.status(400).json({
      error: error.message || "Could not create payment order."
    });
  }
});

// Verify Razorpay payment
app.post("/api/verify-payment", async (req, res) => {
  try {
    if (!razorpay || !KEY_SECRET) {
      return res.status(503).json({
        verified: false,
        error: "Payment gateway is not configured."
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        verified: false,
        error: "Missing payment verification details."
      });
    }

    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest();

    const received = Buffer.from(razorpay_signature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(400).json({
        verified: false,
        error: "Payment signature is invalid."
      });
    }

    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        verified: false,
        error: "Payment has not been captured."
      });
    }

    return res.json({ verified: true });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      verified: false,
      error: "Could not verify payment."
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    store: "RAM COLLECTION"
  });
});

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API route not found."
  });
});

app.listen(PORT, () => {
  console.log("RAM COLLECTION server running on port " + PORT);
});

