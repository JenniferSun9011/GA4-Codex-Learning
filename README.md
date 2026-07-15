# AI Ecommerce Lab

AI Ecommerce Lab is a static Mini Shopify-style ecommerce demo site for GA4 ecommerce event training and Codex-assisted analysis practice.

This is not a production store. It does not process real payments and does not collect real names, emails, phone numbers, addresses, or card details.

## Project Purpose

- Practice GitHub Pages static website deployment.
- Generate GA4 recommended ecommerce events.
- Simulate an ecommerce conversion funnel.
- Prepare for future GA4 Data API analysis of traffic, pages, products, and conversion issues.

GA4 Measurement ID: `G-1SKTM8X221`

## Website Structure

- `index.html` - homepage with hero, CTA, value props, featured products, and blog entry.
- `products.html` - product listing page.
- `product.html?id=tablet-x1` - product detail page driven by URL parameter.
- `cart.html` - localStorage shopping cart.
- `checkout.html` - simulated checkout.
- `thankyou.html` - order confirmation and purchase event page.
- `blog.html` - article listing page.
- `article.html?id=rugged-tablet-guide` - article detail page with product CTA.
- `about.html` - project explanation and safety notice.

## Conversion Paths

Primary product path:

`Home -> Products -> Product Detail -> Add to Cart -> Cart -> Checkout -> Thank You -> Purchase`

Content path:

`Blog -> Article -> Recommended Product -> Product Detail -> Add to Cart -> Checkout -> Purchase`

## Implemented GA4 Ecommerce Events

- `view_item_list` - triggered on `products.html`.
- `select_item` - triggered when a product card or product link is clicked.
- `view_item` - triggered on valid `product.html?id=...` pages.
- `add_to_cart` - triggered by Add to Cart and Buy Now.
- `view_cart` - triggered on `cart.html` when the cart is not empty.
- `remove_from_cart` - triggered when an item is removed from the cart.
- `begin_checkout` - triggered on `checkout.html` when the cart is not empty.
- `add_shipping_info` - triggered when the shipping method changes.
- `add_payment_info` - triggered when the payment method changes.
- `purchase` - triggered once on first view of `thankyou.html` for a transaction ID.

All ecommerce item payloads use stable fields:

- `item_id`
- `item_name`
- `item_brand`
- `item_category`
- `price`
- `quantity`

## Local Testing

You can open `index.html` directly in a browser, or run a simple static server from the project folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Suggested test flow:

1. Open the homepage.
2. Go to Products.
3. Open `Rugged Tablet X1`.
4. Add it to cart.
5. Refresh the cart page and confirm the item remains.
6. Change quantity and remove an item.
7. Add a product again and go to checkout.
8. Change shipping and payment options.
9. Place a demo order.
10. Refresh the Thank You page and confirm `purchase` is not sent again.

## Console Debug Testing

`assets/js/analytics.js` includes:

```js
const GA4_DEBUG = true;
```

When enabled, the browser console prints each event and its full payload:

```text
[GA4 EVENT] add_to_cart
```

To check events:

1. Open browser developer tools.
2. Go to the Console tab.
3. Complete the shopping flow.
4. Confirm each event appears once per intended action.
5. Confirm `purchase` appears only once for the same order after refreshing `thankyou.html`.

## GA4 Realtime Validation

1. Open the GA4 property connected to `G-1SKTM8X221`.
2. Go to Reports.
3. Open Realtime.
4. Visit the site and complete the demo purchase flow.
5. Confirm ecommerce events appear in recent activity.

## GA4 DebugView Validation

1. Open GA4 Admin.
2. Go to DebugView.
3. Open the site in a browser session where GA4 debug traffic is visible.
4. Complete the product and checkout flow.
5. Confirm event order and payload consistency.

## GitHub Pages Deployment

This project is pure HTML, CSS, and JavaScript. No build step is required.

Deployment steps:

1. Push the repository to GitHub.
2. Open repository Settings.
3. Go to Pages.
4. Set Source to `Deploy from a branch`.
5. Select branch `main`.
6. Select folder `/root`.
7. Save.

All internal links and asset paths are relative, so the site works under:

```text
https://<username>.github.io/GA4-Codex-Learning/
```

## Security Notes

- The only public GA4 identifier in the frontend is `G-1SKTM8X221`.
- Do not commit Service Account JSON files.
- Do not commit Google Cloud keys, private keys, API secrets, `.env` files, or credentials folders.
- `.gitignore` blocks common sensitive file patterns:
  - `*.json`
  - `credentials/`
  - `.env`
  - `.env.*`
  - `node_modules/`
  - `.DS_Store`

## Next Phase

- Connect GA4 Data API.
- Create a Service Account outside the repository.
- Use Codex to analyze traffic, product, page, and funnel performance.
- Generate automated growth diagnosis reports.
