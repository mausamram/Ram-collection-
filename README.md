# Ram.collection — Store + Razorpay integration starter

## What's included
- Fashion storefront with 16 sample listings across Men, Women, Kids, Footwear and Accessories, plus category filters, sale section and cart.
- Razorpay Checkout launch from the cart.
- Checkout lists UPI, debit/credit card and net banking. Razorpay displays methods enabled for the merchant account.
- Server-side order creation using server catalogue prices and signature verification.

## Important: not live until configured
GitHub Pages only hosts static files; it cannot run the secure payment server. Deploy this Node.js project to a server host that supports Node, then connect your own domain or update the frontend API base URL if frontend and backend use different domains.

A parent/guardian who manages the merchant account should:
1. In Razorpay Dashboard, create API keys in **Test Mode** first.
2. On the secure server host, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as environment variables. Do not send keys in chat, commit them to GitHub, or put the secret in browser code.
3. Deploy this project with `npm install` and `npm start`.
4. Test UPI, cards and net banking in Test Mode. Then the account owner can complete Razorpay's required checks and switch to Live Mode.
5. Configure webhooks (at least `payment.captured`, `payment.failed`, and `order.paid`) and persist orders before fulfilling anything.

## Run locally
1. Install Node.js.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and enter the test API keys privately.
4. Run `npm start` and open `http://localhost:3000`.

## Production checklist
This starter verifies the checkout signature, but it is not a complete order-management system. Before accepting real payments, add persistent order storage, webhook handling, server-side payment/order status checks (captured/paid), customer contact and shipping details, inventory handling, privacy/returns/shipping policies, and error monitoring. Do not dispatch products based only on the browser callback.


## Catalogue note
The listed products, prices and photos are sample/demo content. Replace them with your actual stock, correct sizes, colours, prices and product photos before accepting customer orders.


## Customer details and Razorpay checkout
The cart checkout now asks for the customer's full name, 10-digit Indian mobile number, delivery address and consent to use the details for order processing. The server validates these fields and attaches the customer/order details to the Razorpay order notes; the customer's name and phone are also prefilled in Razorpay Checkout. Treat this information as personal data: the store owner/guardian must restrict dashboard access, use it only for fulfilment, and publish a clear privacy/returns policy.

## Important deployment note
GitHub Pages hosts static files only. It cannot run `server.js`, so `/api/create-order` and `/api/verify-payment` will not work on GitHub Pages by themselves. Deploy this Node.js server to a trusted HTTPS host, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as server-side environment variables (never in `index.html` or GitHub), then set the frontend API base URL to that server. Have the adult account holder manage the Razorpay merchant account and customer data. Test with Razorpay Test Mode before any live transactions.


## Cash on Delivery (COD)
Checkout lets customers choose Online Payment or Cash on Delivery. COD orders are validated on the Node.js server and saved to `orders.json`. This file-based storage is a starter only; before real sales, move order storage to a managed database with access controls, backups, retention limits and a secure admin order dashboard. Do not expose `orders.json` publicly. Confirm COD orders with the customer before dispatch.

## Important deployment note
GitHub Pages is static hosting and cannot run `server.js` or receive COD orders. Deploy the Node.js project to a trusted HTTPS host. Configure Razorpay keys as server-side environment variables using the adult merchant-account holder; never place secret keys in GitHub or browser code. Test online payment in Razorpay Test Mode and test COD on the deployed backend before going live.


## Product catalogue update
The storefront now includes 31 sample products, with expanded Men's Wear, Women's Wear and Accessories selections. Edit the `products` array in `index.html` to change product names, INR prices, and image URLs before taking real orders.
