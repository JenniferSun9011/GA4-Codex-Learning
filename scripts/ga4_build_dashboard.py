import argparse
import csv
import html
import sys
from datetime import datetime
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    FilterExpressionList,
    Metric,
    RunReportRequest,
)
from google.api_core import exceptions as api_exceptions
from google.auth import exceptions as auth_exceptions
from google.oauth2 import service_account


DEFAULT_PROPERTY_ID = "545479278"
DEFAULT_KEY_PATH = r"D:\GA4-Codex-Learning\Credentials\ga4-service-account.json.json"
DEFAULT_OUTPUT_DIR = r"D:\CodexWork\ga4-data-api-output"

FUNNEL_EVENTS = [
    "page_view",
    "view_item_list",
    "select_item",
    "view_item",
    "add_to_cart",
    "view_cart",
    "begin_checkout",
    "add_shipping_info",
    "add_payment_info",
    "purchase",
]

DIAGNOSTIC_EVENTS = [
    "search",
    "view_search_results",
    "view_promotion",
    "select_promotion",
    "generate_lead",
    "add_to_wishlist",
    "apply_coupon",
    "select_shipping_option",
    "form_start",
    "form_error",
    "checkout_error",
    "payment_failed",
]

# Training assumptions only. These values model a realistic paid-media planning
# discussion and are never sent to GA4 or presented as ad-platform spend.
SIMULATED_AD_CAMPAIGNS = [
    {
        "campaign": "training_paid_search_tablet",
        "channel": "Paid Search",
        "planned_spend": 180.00,
        "planned_clicks": 60,
        "objective": "High-intent rugged tablet demand capture",
    },
    {
        "campaign": "training_paid_social_field_kit",
        "channel": "Paid Social",
        "planned_spend": 120.00,
        "planned_clicks": 80,
        "objective": "Field-team awareness and promotion engagement",
    },
]


def build_client(key_path):
    if not key_path.exists():
        raise FileNotFoundError(f"JSON key file not found: {key_path}")
    credentials = service_account.Credentials.from_service_account_file(
        str(key_path),
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    return BetaAnalyticsDataClient(credentials=credentials)


def event_filter(event_names):
    return FilterExpression(
        filter=Filter(
            field_name="eventName",
            in_list_filter=Filter.InListFilter(values=event_names),
        )
    )


def path_contains_filter(values):
    filters = [
        FilterExpression(
            filter=Filter(
                field_name="pagePath",
                string_filter=Filter.StringFilter(
                    match_type=Filter.StringFilter.MatchType.CONTAINS,
                    value=value,
                ),
            )
        )
        for value in values
    ]
    return FilterExpression(or_group=FilterExpressionList(expressions=filters))


def run_report(
    client,
    property_id,
    dimensions,
    metrics,
    start_date,
    end_date,
    limit=100,
    dimension_filter=None,
    order_bys=None,
):
    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name=name) for name in dimensions],
        metrics=[Metric(name=name) for name in metrics],
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        limit=limit,
        dimension_filter=dimension_filter,
        order_bys=order_bys or [],
    )
    return client.run_report(request)


def rows_from_response(response):
    headers = [header.name for header in response.dimension_headers]
    headers.extend(header.name for header in response.metric_headers)
    rows = []
    for row in response.rows:
        values = [value.value for value in row.dimension_values]
        values.extend(value.value for value in row.metric_values)
        rows.append(values)
    return headers, rows


def write_csv(path, headers, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(headers)
        writer.writerows(rows)


def number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def intish(value):
    return int(round(number(value)))


def ratio(numerator, denominator):
    den = number(denominator)
    if den <= 0:
        return 0.0
    return number(numerator) / den


def pct(value):
    return f"{value * 100:.1f}%"


def row_dicts(headers, rows):
    return [dict(zip(headers, row)) for row in rows]


def get_metric(rows, name):
    if isinstance(rows, dict):
        return number(rows.get(name, 0))
    if not rows:
        return 0
    return number(rows[0].get(name, 0))


def make_table(headers, rows, max_rows=20):
    if not rows:
        return "<p class=\"muted\">No data available.</p>"
    head = "".join(f"<th>{html.escape(header)}</th>" for header in headers)
    body_rows = []
    for row in rows[:max_rows]:
        cells = "".join(f"<td>{html.escape(str(value))}</td>" for value in row)
        body_rows.append(f"<tr>{cells}</tr>")
    more = ""
    if len(rows) > max_rows:
        more = f"<p class=\"muted\">Showing {max_rows} of {len(rows)} rows.</p>"
    return f"<div class=\"table-wrap\"><table><thead><tr>{head}</tr></thead><tbody>{''.join(body_rows)}</tbody></table></div>{more}"


def channel_name(source, medium):
    source = str(source or "").lower()
    medium = str(medium or "").lower()
    if medium in {"cpc", "ppc", "paid_search", "paidsearch"}:
        return "Paid Search"
    if medium in {"paid_social", "paidsocial", "social_paid"}:
        return "Paid Social"
    if medium == "email":
        return "Email"
    if medium == "referral":
        return "Affiliate / Referral"
    if medium in {"ai_assistant", "ai"} or source in {"chatgpt", "perplexity", "gemini"}:
        return "AI Referral"
    if medium == "organic":
        return "SEO / Organic"
    if medium == "(none)" or source == "(direct)":
        return "Direct"
    return "Other"


def build_channel_summary(source_rows):
    grouped = {}
    for row in source_rows:
        name = channel_name(row.get("sessionSource"), row.get("sessionMedium"))
        bucket = grouped.setdefault(name, {"sessions": 0.0, "activeUsers": 0.0, "screenPageViews": 0.0, "keyEvents": 0.0, "transactions": 0.0, "totalRevenue": 0.0})
        for metric in bucket:
            bucket[metric] += number(row.get(metric, 0))

    rows = []
    for name, values in grouped.items():
        sessions = values["sessions"]
        rows.append({
            "channel": name,
            **values,
            "purchaseRate": ratio(values["transactions"], sessions),
            "revenuePerSession": ratio(values["totalRevenue"], sessions),
            "readiness": "Collect more data" if sessions < 20 else "Ready for directional review",
        })
    return sorted(rows, key=lambda row: (row["totalRevenue"], row["sessions"]), reverse=True)


def channel_summary_table_rows(channel_rows):
    headers = ["Channel", "Sessions", "Users", "Page views", "Key events", "Transactions", "Revenue", "Purchase rate", "Revenue / session", "Decision readiness"]
    rows = [
        [
            row["channel"], intish(row["sessions"]), intish(row["activeUsers"]), intish(row["screenPageViews"]),
            intish(row["keyEvents"]), intish(row["transactions"]), f"${row['totalRevenue']:.2f}",
            pct(row["purchaseRate"]), f"${row['revenuePerSession']:.2f}", row["readiness"],
        ]
        for row in channel_rows
    ]
    return headers, rows


def simulated_ad_table_rows(source_rows):
    campaign_data = {}
    for row in source_rows:
        campaign = row.get("sessionCampaignName")
        if not campaign:
            continue
        bucket = campaign_data.setdefault(campaign, {"sessions": 0.0, "transactions": 0.0, "revenue": 0.0})
        bucket["sessions"] += number(row.get("sessions", 0))
        bucket["transactions"] += number(row.get("transactions", 0))
        bucket["revenue"] += number(row.get("totalRevenue", 0))

    headers = [
        "Campaign",
        "Channel",
        "Training objective",
        "Simulated spend",
        "Planned clicks",
        "GA sessions",
        "GA transactions",
        "GA revenue",
        "Simulated CPC",
        "Training CPA",
        "Training ROAS",
        "Decision rule",
    ]
    rows = []
    for plan in SIMULATED_AD_CAMPAIGNS:
        actual = campaign_data.get(plan["campaign"], {})
        spend = plan["planned_spend"]
        clicks = plan["planned_clicks"]
        sessions = number(actual.get("sessions", 0))
        transactions = number(actual.get("transactions", 0))
        revenue = number(actual.get("revenue", 0))
        if sessions < 20:
            decision = "Collect 20-30 GA sessions before comparing creative or landing-page quality"
        elif transactions <= 0:
            decision = "Do not scale: test landing page, offer, and audience before increasing budget"
        else:
            decision = "Directional only: validate with real platform cost before changing live spend"
        rows.append(
            [
                plan["campaign"],
                plan["channel"],
                plan["objective"],
                f"${spend:.2f}",
                intish(clicks),
                intish(sessions),
                intish(transactions),
                f"${revenue:.2f}",
                f"${ratio(spend, clicks):.2f}",
                f"${ratio(spend, transactions):.2f}" if transactions else "N/A",
                f"{ratio(revenue, spend):.2f}x" if spend else "N/A",
                decision,
            ]
        )
    return headers, rows


def build_channel_actions(channel_rows, content_rows, diagnostic_rows):
    by_name = {row["channel"]: row for row in channel_rows}
    paid_sessions = sum(by_name.get(name, {}).get("sessions", 0) for name in ("Paid Search", "Paid Social"))
    affiliate = by_name.get("Affiliate / Referral", {})
    organic = by_name.get("SEO / Organic", {})
    ai_referral = by_name.get("AI Referral", {})
    leads = sum(number(row.get("eventCount")) for row in diagnostic_rows if row.get("eventName") == "generate_lead")
    return [
        {"area": "Advertising", "title": "Rehearse paid-media decisions with transparent training assumptions", "evidence": f"Paid sessions={intish(paid_sessions)}. Simulated spend is shown separately from GA4 revenue.", "action": "Use Training ROAS and CPA only to practise decisions. Keep paid budgets in test mode until each source has 20-30 sessions; replace assumptions with platform cost before live spend changes."},
        {"area": "SEO", "title": "Use content pages to validate search-intent demand", "evidence": f"SEO / Organic sessions={intish(organic.get('sessions', 0))}; tracked Blog / Article paths={len(content_rows)}.", "action": "Prioritize content pages that generate product views or leads. Improve CTA and internal product links before expanding keyword volume."},
        {"area": "Affiliate", "title": "Judge partners by downstream purchase quality", "evidence": f"Affiliate / Referral sessions={intish(affiliate.get('sessions', 0))}; AI Referral sessions={intish(ai_referral.get('sessions', 0))}.", "action": "Keep partners that drive product interest and checkout starts. Pause placements that only create page views after the sample reaches 20-30 sessions."},
        {"area": "User Asset Growth", "title": "Connect content traffic to reusable lead signals", "evidence": f"generate_lead events={intish(leads)}.", "action": "Compare lead creation by article, source, and promotion entry before investing in more content distribution."},
    ]


def build_insights(summary, funnel_rows, source_rows, page_rows, product_event_rows, content_rows, diagnostic_rows):
    insights = []
    sessions = get_metric(summary, "sessions")
    users = get_metric(summary, "activeUsers")
    views = get_metric(summary, "screenPageViews")
    events = get_metric(summary, "eventCount")

    event_counts = {row.get("eventName"): number(row.get("eventCount")) for row in funnel_rows}
    view_items = event_counts.get("view_item", 0)
    add_to_cart = event_counts.get("add_to_cart", 0)
    begin_checkout = event_counts.get("begin_checkout", 0)
    purchase = event_counts.get("purchase", 0)
    traffic_click = event_counts.get("traffic_test_click", 0)
    diagnostic_counts = {row.get("eventName"): number(row.get("eventCount")) for row in diagnostic_rows}
    leads = diagnostic_counts.get("generate_lead", 0)
    payment_failed = diagnostic_counts.get("payment_failed", 0)
    checkout_errors = diagnostic_counts.get("checkout_error", 0)

    insights.append(
        {
            "area": "Business Growth",
            "title": "流量样本仍偏小，适合验证配置，不适合做最终投放判断",
            "evidence": f"最近周期 activeUsers={intish(users)}, sessions={intish(sessions)}, views={intish(views)}, events={intish(events)}。",
            "action": "先按来源各制造 20-30 个会话，再比较转化率；当前优先看事件链路是否完整。",
        }
    )

    if view_items:
        insights.append(
            {
                "area": "Conversion",
                "title": "商品页到加购的动作链路已打通",
                "evidence": f"view_item={intish(view_items)}, add_to_cart={intish(add_to_cart)}, add_to_cart/view_item={pct(ratio(add_to_cart, view_items))}。",
                "action": "下一步应增加不同商品与不同入口样本，比较哪类商品页更能推动加购。",
            }
        )
    if begin_checkout:
        insights.append(
            {
                "area": "Revenue",
                "title": "Checkout 到 Purchase 可以继续作为核心转化漏斗",
                "evidence": f"begin_checkout={intish(begin_checkout)}, purchase={intish(purchase)}, purchase/begin_checkout={pct(ratio(purchase, begin_checkout))}。",
                "action": "正式看板中把 purchase 作为 Key event，把 begin_checkout 到 purchase 的流失作为付款页诊断重点。",
            }
        )
    if traffic_click:
        insights.append(
            {
                "area": "Traffic",
                "title": "Referral / AI 测试入口已经能被识别",
                "evidence": f"traffic_test_click={intish(traffic_click)}。",
                "action": "继续分别跑 referral、ai_assistant、direct 三类路径，后续按 source/medium 看哪类入口推动产品浏览和购买。",
            }
        )
    if source_rows:
        top = source_rows[0]
        insights.append(
            {
                "area": "ROI",
                "title": "先用 source / medium 判断流量质量，而不是只看访问量",
                "evidence": f"当前最高来源是 {top.get('sessionSource','-')} / {top.get('sessionMedium','-')}，sessions={top.get('sessions','0')}。",
                "action": "保留能带来 view_item、add_to_cart、purchase 的来源；只带来 page_view 的来源暂不扩大。",
            }
        )
    if content_rows:
        insights.append(
            {
                "area": "User Asset Growth",
                "title": "Blog / Article 是后续做用户资产入口的关键观察对象",
                "evidence": f"内容页路径记录数={len(content_rows)}。",
                "action": "后续可把内容页 CTA、推荐商品、UTM 来源组合起来，沉淀可复用的获客入口。",
            }
        )
    if product_event_rows:
        insights.append(
            {
                "area": "Product",
                "title": "商品维度已具备基础分析条件",
                "evidence": f"商品事件记录数={len(product_event_rows)}。",
                "action": "下一步按 itemName + eventName 计算每个商品的浏览、加购、购买差异。",
            }
        )
    if payment_failed or checkout_errors:
        insights.append(
            {
                "area": "Checkout Diagnosis",
                "title": "Checkout errors are available for diagnosis",
                "evidence": f"payment_failed={intish(payment_failed)}, checkout_error={intish(checkout_errors)}.",
                "action": "Compare failure events by device, source, and payment method before changing the checkout experience.",
            }
        )
    if leads:
        insights.append(
            {
                "area": "User Asset Growth",
                "title": "Newsletter lead signals are now measurable",
                "evidence": f"generate_lead={intish(leads)}.",
                "action": "Compare lead rate and downstream product engagement by content page and acquisition source.",
            }
        )
    return insights


def render_dashboard(path, context):
    insights_html = "".join(
        [
            "<article class=\"insight\">"
            f"<p>{html.escape(item['area'])}</p>"
            f"<h3>{html.escape(item['title'])}</h3>"
            f"<div><strong>Evidence:</strong> {html.escape(item['evidence'])}</div>"
            f"<div><strong>Action:</strong> {html.escape(item['action'])}</div>"
            "</article>"
            for item in context["insights"]
        ]
    )
    kpi_cards = "".join(
        f"<article class=\"kpi\"><p>{html.escape(label)}</p><strong>{html.escape(value)}</strong></article>"
        for label, value in context["kpis"]
    )
    decision_html = "".join(
        [
            "<article class=\"insight\">"
            f"<p>{html.escape(item['area'])}</p>"
            f"<h3>{html.escape(item['title'])}</h3>"
            f"<div><strong>Evidence:</strong> {html.escape(item['evidence'])}</div>"
            f"<div><strong>Action:</strong> {html.escape(item['action'])}</div>"
            "</article>"
            for item in context["channel_actions"]
        ]
    )
    sections = "".join(
        [
            f"<section><h2>{html.escape(section['title'])}</h2><p>{html.escape(section['description'])}</p>{section['table']}</section>"
            for section in context["sections"]
        ]
    )
    generated = html.escape(context["generated"])
    date_range = html.escape(context["date_range"])
    property_id = html.escape(context["property_id"])
    html_doc = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GA4 Independent Store Growth Dashboard</title>
  <style>
    body {{ margin: 0; font-family: Arial, sans-serif; color: #172026; background: #f6f8f9; }}
    header {{ padding: 28px 40px; background: #0f2f35; color: #fff; }}
    main {{ padding: 28px 40px 56px; }}
    h1 {{ margin: 0 0 8px; font-size: 28px; }}
    h2 {{ margin: 0 0 8px; font-size: 20px; }}
    h3 {{ margin: 6px 0 10px; font-size: 17px; }}
    p {{ line-height: 1.5; }}
    .meta {{ color: #c8d7dc; margin: 0; }}
    .grid {{ display: grid; gap: 16px; }}
    .kpis {{ grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: 24px 0; }}
    .kpi, .insight, section {{ background: #fff; border: 1px solid #dfe7ea; border-radius: 8px; padding: 18px; }}
    .kpi p, .insight p {{ margin: 0; color: #65757c; font-size: 13px; }}
    .kpi strong {{ display: block; margin-top: 8px; font-size: 28px; }}
    .insights {{ grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin: 18px 0 28px; }}
    section {{ margin-bottom: 18px; }}
    .table-wrap {{ overflow-x: auto; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
    th, td {{ border-bottom: 1px solid #e6ecef; padding: 9px 10px; text-align: left; white-space: nowrap; }}
    th {{ background: #f0f4f5; color: #33434a; }}
    .muted {{ color: #65757c; }}
  </style>
</head>
<body>
  <header>
    <h1>GA4 Independent Store Growth Dashboard</h1>
    <p class="meta">Property {property_id} · {date_range} · Generated {generated}</p>
  </header>
  <main>
    <div class="grid kpis">{kpi_cards}</div>
    <h2>Action Guidance</h2>
    <div class="grid insights">{insights_html}</div>
    <h2>Advertising, SEO, and Affiliate Decisions</h2>
    <div class="grid insights">{decision_html}</div>
    {sections}
  </main>
</body>
</html>
"""
    path.write_text(html_doc, encoding="utf-8")


def classify_error(error):
    message = str(error)
    if isinstance(error, FileNotFoundError):
        return "JSON Key problem: key file path does not exist."
    if isinstance(error, auth_exceptions.GoogleAuthError):
        return "JSON Key problem: service account key could not authenticate."
    if isinstance(error, api_exceptions.PermissionDenied):
        if "SERVICE_DISABLED" in message or "has not been used" in message:
            return "API problem: Google Analytics Data API may not be enabled for this Google Cloud project."
        return "Permission problem: service account may not have GA4 property Viewer access."
    if isinstance(error, api_exceptions.Unauthenticated):
        return "JSON Key problem: credentials were rejected by Google."
    if isinstance(error, api_exceptions.NotFound):
        return "Property ID problem: GA4 property was not found or is not accessible."
    if isinstance(error, api_exceptions.InvalidArgument):
        return "Property ID or request problem: check the property ID, dimensions, metrics, or custom definitions."
    if isinstance(error, ModuleNotFoundError):
        return "Python dependency problem: google-analytics-data is not installed in this environment."
    return "Unknown GA4 Data API problem."


def main():
    parser = argparse.ArgumentParser(description="Build an actionable GA4 ecommerce operations dashboard.")
    parser.add_argument("--property-id", default=DEFAULT_PROPERTY_ID)
    parser.add_argument("--key-path", default=DEFAULT_KEY_PATH)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--start-date", default="7daysAgo")
    parser.add_argument("--end-date", default="today")
    parser.add_argument(
        "--export-csv",
        action="store_true",
        help="Also export the underlying report tables as CSV files.",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    client = build_client(Path(args.key_path))

    report_specs = [
        {
            "key": "summary",
            "title": "Overview",
            "description": "总体流量与行为规模，用来判断样本量和运营盘子大小。",
            "dimensions": [],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount", "keyEvents", "transactions", "totalRevenue"],
            "limit": 10,
        },
        {
            "key": "traffic_sources",
            "title": "Traffic Sources",
            "description": "按 source / medium / campaign 判断流量质量，指导保留、扩大或暂停来源。",
            "dimensions": ["sessionSource", "sessionMedium", "sessionCampaignName"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount", "keyEvents", "transactions", "totalRevenue"],
            "limit": 100,
        },
        {
            "key": "channel_landing_pages",
            "title": "Channel Landing Pages",
            "description": "Maps traffic source and campaign to landing page so advertising, SEO, and affiliate traffic can be diagnosed before budget or content changes.",
            "dimensions": ["sessionSource", "sessionMedium", "sessionCampaignName", "landingPagePlusQueryString"],
            "metrics": ["sessions", "keyEvents", "transactions", "totalRevenue"],
            "limit": 100,
            "optional": True,
        },
        {
            "key": "event_funnel",
            "title": "Event Funnel",
            "description": "用推荐电商事件观察用户从访问到购买的动作链路。",
            "dimensions": ["eventName"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount"],
            "dimension_filter": event_filter(FUNNEL_EVENTS + ["traffic_test_click"]),
            "limit": 100,
        },
        {
            "key": "pages",
            "title": "Pages",
            "description": "识别哪些页面带来浏览、事件和用户行为，是页面优化和内容扩展的基础。",
            "dimensions": ["pagePath", "pageTitle"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount", "keyEvents"],
            "limit": 100,
        },
        {
            "key": "conversion_diagnostics",
            "title": "Conversion Diagnostics",
            "description": "Search, promotion, lead, coupon, shipping, form, and payment-failure events used to explain funnel movement.",
            "dimensions": ["eventName"],
            "metrics": ["activeUsers", "sessions", "eventCount"],
            "dimension_filter": event_filter(DIAGNOSTIC_EVENTS),
            "limit": 100,
        },
        {
            "key": "content_pages",
            "title": "Blog and Article Pages",
            "description": "单独观察内容流量入口，用于判断 SEO、referral、AI 入口是否有商业价值。",
            "dimensions": ["pagePath", "pageTitle"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount"],
            "dimension_filter": path_contains_filter(["blog.html", "article.html"]),
            "limit": 100,
        },
        {
            "key": "product_events",
            "title": "Product Events",
            "description": "按商品观察浏览、加购、购买和收入，为商品页和品类优化提供依据。",
            "dimensions": ["itemName", "itemId", "itemCategory"],
            "metrics": ["itemsViewed", "itemsAddedToCart", "itemsPurchased", "itemRevenue"],
            "limit": 100,
        },
        {
            "key": "devices",
            "title": "Device Performance",
            "description": "按设备判断移动端、桌面端是否存在体验或转化差异。",
            "dimensions": ["deviceCategory"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount", "keyEvents", "transactions"],
            "limit": 20,
        },
        {
            "key": "countries",
            "title": "Country Performance",
            "description": "按国家观察流量地域分布，为后续投放和内容本地化提供方向。",
            "dimensions": ["country"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount", "keyEvents", "transactions"],
            "limit": 50,
        },
    ]

    optional_specs = [
        {
            "key": "traffic_test_type",
            "title": "Traffic Test Type",
            "description": "按自定义维度 test_type 对比 referral 与 AI 测试入口。",
            "dimensions": ["customEvent:test_type"],
            "metrics": ["activeUsers", "sessions", "eventCount", "keyEvents", "transactions"],
            "limit": 50,
            "optional": True,
        },
        {
            "key": "traffic_test_link_label",
            "title": "Traffic Test Link Label",
            "description": "按自定义维度 link_label 判断具体测试链接质量。",
            "dimensions": ["customEvent:link_label"],
            "metrics": ["activeUsers", "sessions", "eventCount", "keyEvents", "transactions"],
            "limit": 50,
            "optional": True,
        },
    ]

    results = {}
    csv_files = []
    warnings = []

    for spec in report_specs + optional_specs:
        try:
            response = run_report(
                client=client,
                property_id=args.property_id,
                dimensions=spec["dimensions"],
                metrics=spec["metrics"],
                start_date=args.start_date,
                end_date=args.end_date,
                limit=spec.get("limit", 100),
                dimension_filter=spec.get("dimension_filter"),
            )
            headers, rows = rows_from_response(response)
            results[spec["key"]] = {"spec": spec, "headers": headers, "rows": rows, "dicts": row_dicts(headers, rows)}
            if args.export_csv:
                csv_path = output_dir / f"{timestamp}-{spec['key']}.csv"
                write_csv(csv_path, headers, rows)
                csv_files.append(csv_path)
        except api_exceptions.InvalidArgument as error:
            if spec.get("optional"):
                warnings.append(f"Optional report skipped: {spec['title']} ({error})")
            else:
                raise

    summary = results["summary"]["dicts"]
    summary_row = summary[0] if summary else {}
    funnel_rows = results["event_funnel"]["dicts"]
    source_rows = results["traffic_sources"]["dicts"]
    channel_rows = build_channel_summary(source_rows)
    channel_headers, channel_table_rows = channel_summary_table_rows(channel_rows)
    ad_headers, ad_table_rows = simulated_ad_table_rows(source_rows)
    page_rows = results["pages"]["dicts"]
    product_event_rows = results["product_events"]["dicts"]
    content_rows = results["content_pages"]["dicts"]
    diagnostic_rows = results["conversion_diagnostics"]["dicts"]
    channel_actions = build_channel_actions(channel_rows, content_rows, diagnostic_rows)

    kpis = [
        ("Active users", str(intish(summary_row.get("activeUsers", 0)))),
        ("Sessions", str(intish(summary_row.get("sessions", 0)))),
        ("Page views", str(intish(summary_row.get("screenPageViews", 0)))),
        ("Event count", str(intish(summary_row.get("eventCount", 0)))),
        ("Key events", str(intish(summary_row.get("keyEvents", 0)))),
        ("Transactions", str(intish(summary_row.get("transactions", 0)))),
        ("Revenue", f"${number(summary_row.get('totalRevenue', 0)):.2f}"),
    ]

    sections = []
    sections.append(
        {
            "title": "Channel Decision Matrix",
            "description": "Use this table to compare channel quality. It uses GA4 behavior and revenue only; no advertising cost is mixed into the source data.",
            "table": make_table(channel_headers, channel_table_rows, max_rows=20),
        }
    )
    sections.append(
        {
            "title": "Simulated Paid Media Planning",
            "description": "Training spend and planned clicks are explicit assumptions. Training CPA and ROAS combine those assumptions with GA-attributed results for decision practice only.",
            "table": make_table(ad_headers, ad_table_rows, max_rows=20),
        }
    )
    for key in [
        "traffic_sources",
        "channel_landing_pages",
        "event_funnel",
        "pages",
        "conversion_diagnostics",
        "content_pages",
        "product_events",
        "devices",
        "countries",
        "traffic_test_type",
        "traffic_test_link_label",
    ]:
        result = results.get(key)
        if not result:
            continue
        spec = result["spec"]
        sections.append(
            {
                "title": spec["title"],
                "description": spec["description"],
                "table": make_table(result["headers"], result["rows"], max_rows=25),
            }
        )

    insights = build_insights(summary_row, funnel_rows, source_rows, page_rows, product_event_rows, content_rows, diagnostic_rows)
    dashboard_path = output_dir / f"{timestamp}-ga4-operations-dashboard.html"
    render_dashboard(
        dashboard_path,
        {
            "property_id": args.property_id,
            "date_range": f"{args.start_date} to {args.end_date}",
            "generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "kpis": kpis,
            "insights": insights,
            "channel_actions": channel_actions,
            "sections": sections,
        },
    )

    print(f"GA4 property: {args.property_id}")
    print(f"Date range: {args.start_date} to {args.end_date}")
    print(f"Dashboard: {dashboard_path}")
    print("\nKPI summary")
    for label, value in kpis:
        print(f"- {label}: {value}")
    print("\nAction guidance")
    for insight in insights:
        print(f"- [{insight['area']}] {insight['title']} | {insight['action']}")
    if args.export_csv:
        print("\nCSV files")
        for csv_path in csv_files:
            print(f"- {csv_path}")
    else:
        print("\nDetailed CSV exports: disabled (use --export-csv when needed).")
    if warnings:
        print("\nWarnings")
        for warning in warnings:
            print(f"- {warning}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("\nGA4 dashboard build failed.", file=sys.stderr)
        print(classify_error(error), file=sys.stderr)
        print(f"Raw error type: {type(error).__name__}", file=sys.stderr)
        print(f"Raw error message: {error}", file=sys.stderr)
        sys.exit(1)
