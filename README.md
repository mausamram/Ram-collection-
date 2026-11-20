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
