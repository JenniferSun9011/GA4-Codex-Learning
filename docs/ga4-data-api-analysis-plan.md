# GA4 Data API Analysis Plan

This project is ready for GA4 Data API analysis after the property has enough traffic and a service account is granted read access.

Do not commit service account JSON keys, API secrets, or `.env` files to this repository.

## Primary Questions

1. Which traffic sources bring users who reach `view_item`, `add_to_cart`, `begin_checkout`, and `purchase`?
2. Which pages create the best product-detail visits from blog or article traffic?
3. Which products have the highest add-to-cart and purchase conversion rates?
4. Where does the funnel lose the most users by source, device, and landing page?
5. Do AI-assistant and referral test links generate different conversion behavior?

## Recommended Dimensions

- `date`
- `sessionSource`
- `sessionMedium`
- `sessionCampaignName`
- `pagePath`
- `pageTitle`
- `deviceCategory`
- `country`
- `eventName`
- `itemId`
- `itemName`
- `itemCategory`
- Custom dimension: `test_type`
- Custom dimension: `link_label`

## Recommended Metrics

- `activeUsers`
- `sessions`
- `screenPageViews`
- `eventCount`
- `keyEvents`
- `transactions`
- `totalRevenue`
- `ecommercePurchases`
- `addToCarts`
- `checkouts`

## MVP Analysis Reports

The repository includes two read-only scripts:

- `scripts/ga4_run_report.py` exports basic summary, event, and page reports.
- `scripts/ga4_build_dashboard.py` builds a local HTML operations dashboard and CSV detail files.

Default local output path:

```text
D:\CodexWork\ga4-data-api-output
```

Recommended command:

```powershell
& 'D:\CodexWork\ga4-data-api-venv\Scripts\python.exe' 'D:\CodexWork\GA4-Codex-Learning\scripts\ga4_build_dashboard.py'
```

### 1. Traffic Quality

Group by `sessionSource`, `sessionMedium`, and `sessionCampaignName`.

Measure:

- Sessions
- Active users
- Product views
- Add to carts
- Checkouts
- Purchases
- Purchase rate

Decision use:

- Keep scalable traffic sources with purchase or checkout movement.
- Improve or pause sources with visits but no product/cart movement.

### 2. Content Assisted Conversion

Group by `pagePath` and `pageTitle`.

Filter to blog and article paths:

- `/GA4-Codex-Learning/blog.html`
- `/GA4-Codex-Learning/article.html`

Measure:

- Views
- Product detail views after content visits
- Add to carts
- Purchases

Decision use:

- Expand article topics that move readers into product pages.
- Rewrite or reposition CTAs on articles with high views and low product clicks.

### 3. Product Funnel

Group by `itemId`, `itemName`, and `itemCategory`.

Measure:

- `view_item`
- `add_to_cart`
- `begin_checkout`
- `purchase`
- Product add-to-cart rate
- Product purchase rate

Decision use:

- Improve product pages with views but weak add-to-cart.
- Improve checkout or cart messaging for products with add-to-cart but weak purchase.

### 4. AI and Referral Test

Group by custom dimensions `test_type` and `link_label`.

Measure:

- Sessions
- Product views
- Add to carts
- Purchases

Decision use:

- Compare AI assistant traffic against referral traffic.
- Identify which simulated placements are worth repeating in future experiments.

## Minimum Data Needed

For useful analysis, generate at least:

- 20 to 30 sessions per source type.
- 10 or more article-to-product journeys.
- 5 or more purchases across different products.

Small samples are fine for setup validation, but not for business conclusions.
