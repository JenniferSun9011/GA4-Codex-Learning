# Simulated Paid Media Assumptions

The GA4 property contains website behavior and revenue only. The values below are
training assumptions used in the Independent Store Growth Dashboard; they are not
Google Ads, Meta Ads, or Affiliate-platform cost imports.

| Campaign | Channel | Simulated spend | Planned clicks | Objective |
| --- | --- | ---: | ---: | --- |
| `training_paid_search_tablet` | Paid Search | $180.00 | 60 | High-intent rugged tablet demand capture |
| `training_paid_social_field_kit` | Paid Social | $120.00 | 80 | Field-team awareness and promotion engagement |

## Dashboard formulas

- Simulated CPC = simulated spend / planned clicks
- Training CPA = simulated spend / GA transactions
- Training ROAS = GA attributed revenue / simulated spend

Use these numbers only to rehearse channel decisions. Before moving real budget,
replace them with actual platform spend, clicks, and campaign attribution data.
