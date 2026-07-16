# Phase 0-2 GA4 Training Setup

This site is a training environment. It never collects real payment or personal data.

## Event parameters to register in GA4

Create these as event-scoped custom dimensions in **Admin > Custom definitions**. Use
the exact parameter names and set the scope to **Event**.

| Parameter | Suggested dimension name | Purpose |
| --- | --- | --- |
| `environment` | Training environment | Separates training traffic from future live traffic. |
| `training_scenario` | Training scenario | Identifies the page or UTM campaign used in a simulation. |
| `lead_type` | Lead type | Separates simulated newsletter leads from future lead types. |
| `lead_source` | Lead source | Shows whether a lead came from blog or article content. |
| `coupon_status` | Coupon status | Compares valid and invalid promotion-code attempts. |
| `error_type` | Checkout error type | Explains validation and payment failure events. |
| `payment_type` | Payment type | Compares demo payment methods and failure paths. |

Register `coupon` only if coupon-level reporting is needed. Do not create or send
dimensions for email address, name, phone number, payment number, or physical address.

## Event map

| Journey area | Events |
| --- | --- |
| Search and discovery | `search`, `view_search_results`, `view_item_list`, `select_item`, `view_item` |
| Promotion and content | `view_promotion`, `select_promotion`, `traffic_test_click`, `generate_lead` |
| Cart and checkout | `add_to_cart`, `view_cart`, `apply_coupon`, `begin_checkout`, `select_shipping_option`, `add_shipping_info`, `add_payment_info` |
| Conversion diagnostics | `form_start`, `form_error`, `checkout_error`, `payment_failed`, `purchase` |

## Training scenarios

Use the existing traffic-test cards to create repeatable sessions for Referral, AI,
Paid Search, Paid Social, and Email. For directional comparison, generate at least
20 to 30 sessions per source before interpreting conversion-rate differences.

The dashboard is intended for configuration validation and trend learning. Simulated
ad spend, refunds, and customer lifetime value are outside Phase 0-2 and should not
be inferred from the current reports.
