"""Build compact, lossless dashboard aggregates from the source CSV."""
import csv
import re
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "frontend" / "data" / "cirugia_estetica.csv"
OUTPUT = ROOT / "frontend" / "data" / "cirugia_estetica_dashboard.csv"
KEYS = ("Year", "Country", "City", "Procedure")
FIELDS = (*KEYS, "Record Count", "Surgeons Sum", "Average Price Sum", "Min Price Sum",
          "Max Price Sum", "Min Average Price", "Max Average Price", "Range Min", "Range Max")


def amount(value):
    return Decimal(re.sub(r"[$,\s]", "", value))


groups = {}
with SOURCE.open(encoding="utf-8-sig", newline="") as source:
    for row in csv.DictReader(source):
        key = tuple(row[field].strip() for field in KEYS)
        match = re.fullmatch(r"\s*\$?\s*([\d,]+(?:\.\d+)?)\s*[-–]\s*\$?\s*([\d,]+(?:\.\d+)?)\s*", row["Price Range"])
        if not match:
            raise ValueError(f"Invalid price range for {key}: {row['Price Range']!r}")
        low, high = amount(match.group(1)), amount(match.group(2))
        avg, surgeons = amount(row["Average Price"]), amount(row["Number of Surgeons"])
        item = groups.get(key)
        if item is None:
            item = {"count": 0, "surgeons": Decimal(0), "avg_sum": Decimal(0),
                    "low_sum": Decimal(0), "high_sum": Decimal(0),
                    "min_avg": avg, "max_avg": avg, "range_min": low, "range_max": high}
            groups[key] = item
        item["count"] += 1
        item["surgeons"] += surgeons
        item["avg_sum"] += avg
        item["low_sum"] += low
        item["high_sum"] += high
        item["min_avg"] = min(item["min_avg"], avg)
        item["max_avg"] = max(item["max_avg"], avg)
        item["range_min"] = min(item["range_min"], low)
        item["range_max"] = max(item["range_max"], high)

with OUTPUT.open("w", encoding="utf-8", newline="") as output:
    writer = csv.DictWriter(output, fieldnames=FIELDS)
    writer.writeheader()
    for key, item in sorted(groups.items()):
        writer.writerow(dict(zip(KEYS, key)) | {
            "Record Count": item["count"], "Surgeons Sum": item["surgeons"],
            "Average Price Sum": item["avg_sum"], "Min Price Sum": item["low_sum"],
            "Max Price Sum": item["high_sum"], "Min Average Price": item["min_avg"],
            "Max Average Price": item["max_avg"], "Range Min": item["range_min"],
            "Range Max": item["range_max"],
        })

print(f"Built {len(groups):,} aggregated rows from {SOURCE.name} into {OUTPUT.name}")
