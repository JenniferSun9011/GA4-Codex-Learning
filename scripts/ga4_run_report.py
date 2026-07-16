import argparse
import csv
import sys
from datetime import datetime
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest
from google.api_core import exceptions as api_exceptions
from google.auth import exceptions as auth_exceptions
from google.oauth2 import service_account


DEFAULT_PROPERTY_ID = "545479278"
DEFAULT_KEY_PATH = r"D:\GA4-Codex-Learning\Credentials\ga4-service-account.json.json"
DEFAULT_OUTPUT_DIR = r"D:\CodexWork\ga4-data-api-output"


def build_client(key_path):
    if not key_path.exists():
        raise FileNotFoundError(f"JSON key file not found: {key_path}")
    credentials = service_account.Credentials.from_service_account_file(
        str(key_path),
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    return BetaAnalyticsDataClient(credentials=credentials)


def run_report(client, property_id, dimensions, metrics, start_date, end_date, limit=100):
    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name=name) for name in dimensions],
        metrics=[Metric(name=name) for name in metrics],
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        limit=limit,
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


def print_table(title, headers, rows, max_rows=30):
    print(f"\n=== {title} ===")
    print(",".join(headers))
    if not rows:
        print("(no rows)")
        return
    for row in rows[:max_rows]:
        print(",".join(row))
    if len(rows) > max_rows:
        print(f"... {len(rows) - max_rows} more rows")


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
        return "Property ID or request problem: check the property ID, dimensions, and metrics."
    if isinstance(error, ModuleNotFoundError):
        return "Python dependency problem: google-analytics-data is not installed in this environment."
    return "Unknown GA4 Data API problem."


def main():
    parser = argparse.ArgumentParser(description="Read GA4 reports with the Google Analytics Data API.")
    parser.add_argument("--property-id", default=DEFAULT_PROPERTY_ID)
    parser.add_argument("--key-path", default=DEFAULT_KEY_PATH)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--start-date", default="7daysAgo")
    parser.add_argument("--end-date", default="today")
    args = parser.parse_args()

    key_path = Path(args.key_path)
    output_dir = Path(args.output_dir)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    client = build_client(key_path)

    reports = [
        {
            "title": "summary_last_7_days",
            "dimensions": [],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount"],
            "limit": 10,
        },
        {
            "title": "events_by_eventName_last_7_days",
            "dimensions": ["eventName"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount"],
            "limit": 100,
        },
        {
            "title": "pages_by_pagePath_last_7_days",
            "dimensions": ["pagePath"],
            "metrics": ["activeUsers", "sessions", "screenPageViews", "eventCount"],
            "limit": 100,
        },
    ]

    print(f"GA4 property: {args.property_id}")
    print(f"Date range: {args.start_date} to {args.end_date}")
    print(f"CSV output directory: {output_dir}")

    for report in reports:
        response = run_report(
            client=client,
            property_id=args.property_id,
            dimensions=report["dimensions"],
            metrics=report["metrics"],
            start_date=args.start_date,
            end_date=args.end_date,
            limit=report["limit"],
        )
        headers, rows = rows_from_response(response)
        print_table(report["title"], headers, rows)
        csv_path = output_dir / f"{timestamp}-{report['title']}.csv"
        write_csv(csv_path, headers, rows)
        print(f"CSV: {csv_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("\nGA4 Data API call failed.", file=sys.stderr)
        print(classify_error(error), file=sys.stderr)
        print(f"Raw error type: {type(error).__name__}", file=sys.stderr)
        print(f"Raw error message: {error}", file=sys.stderr)
        sys.exit(1)
