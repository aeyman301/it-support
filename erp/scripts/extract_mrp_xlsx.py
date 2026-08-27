#!/usr/bin/env python3
"""
Extracts materials, outstanding purchase orders, and production plan demand
from PNA Technologies' monthly "MRP PLAN ALL" workbook into a single JSON
file that scripts/import_to_firestore.mjs can load.

Usage:
    python3 extract_mrp_xlsx.py <path-to-xlsx> [--limit N] [--out out.json]

The workbook's layout (sheet names, header rows, column positions) is a
recurring monthly report format from the supply chain team. If a future
month's file shifts columns around, adjust the constants below rather than
the parsing logic.
"""

import argparse
import json
import sys
from datetime import datetime, date

try:
    import openpyxl
except ImportError:
    print("Missing dependency: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

RAW_STOCK_SHEET = "1. Raw Stock - Warehouse"
RAW_STOCK_HEADER_ROW = 6
RAW_STOCK_FIRST_DATA_ROW = 7
COL_CODE = 2  # COMPONENT PART NO
COL_DESC = 4  # DESCRIPTION
COL_SUPPLIER = 5  # SUPPLIER
COL_UOM = 7  # UOM (B0M)
COL_ONHAND = 12  # STOCK TAKE CLOSING

MRP_SHEET = "MRP"
MRP_HEADER_ROW = 9
MRP_FIRST_DATA_ROW = 10
MRP_COL_CODE = 2  # PNA PART NO
# Monthly incoming-PO-quantity columns (matches OPEN PO ALL's schedule).
MRP_INCOMING_COLS = range(10, 16)  # Aug26..Jan27
# Monthly forecasted-usage/demand columns.
MRP_DEMAND_COLS = range(20, 30)  # Aug26..May27

DEFAULT_MIN_ORDER_QTY = 1


def sanitize_id(value) -> str:
    text = str(value).strip()
    text = text.replace("/", "-")
    return text or "UNKNOWN"


def month_end_iso(dt) -> str | None:
    if not isinstance(dt, (datetime, date)):
        return None
    return dt.strftime("%Y-%m-%d")


def as_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    return None


def extract(path: str, limit: int | None):
    wb = openpyxl.load_workbook(path, data_only=True)

    # ---- Materials (+ on-hand stock) ----
    ws = wb[RAW_STOCK_SHEET]
    materials = []
    seen_codes = set()
    for r in range(RAW_STOCK_FIRST_DATA_ROW, ws.max_row + 1):
        raw_code = ws.cell(row=r, column=COL_CODE).value
        if raw_code in (None, ""):
            continue
        code = sanitize_id(raw_code)
        if code in seen_codes:
            continue  # duplicate part number row, keep the first
        seen_codes.add(code)

        desc = ws.cell(row=r, column=COL_DESC).value or code
        supplier = ws.cell(row=r, column=COL_SUPPLIER).value
        supplier = str(supplier).strip() if supplier not in (None, 0, "0") else ""
        uom = ws.cell(row=r, column=COL_UOM).value or "pcs"
        onhand = as_number(ws.cell(row=r, column=COL_ONHAND).value) or 0

        materials.append(
            {
                "id": code,
                "code": code,
                "name": str(desc).strip(),
                "uom": str(uom).strip(),
                "leadTimeDays": 0,
                "safetyStock": 0,
                "minOrderQty": DEFAULT_MIN_ORDER_QTY,
                "onHandQty": round(onhand),
                "notes": f"Supplier: {supplier}" if supplier else "",
            }
        )
        if limit and len(materials) >= limit:
            break

    material_ids = {m["id"] for m in materials}

    # ---- Purchase orders + production plan, from the MRP sheet ----
    ws2 = wb[MRP_SHEET]
    header = [ws2.cell(row=MRP_HEADER_ROW, column=c).value for c in range(1, 30)]
    incoming_dates = {c: month_end_iso(header[c - 1]) for c in MRP_INCOMING_COLS}
    demand_dates = {c: month_end_iso(header[c - 1]) for c in MRP_DEMAND_COLS}

    today_iso = date.today().isoformat()
    purchase_orders = []
    production_plan = []
    matched = 0
    skipped = 0

    for r in range(MRP_FIRST_DATA_ROW, ws2.max_row + 1):
        raw_code = ws2.cell(row=r, column=MRP_COL_CODE).value
        if raw_code in (None, ""):
            continue
        code = sanitize_id(raw_code)
        if code not in material_ids:
            skipped += 1
            continue
        matched += 1

        for col, iso_date in incoming_dates.items():
            if not iso_date:
                continue
            qty = as_number(ws2.cell(row=r, column=col).value)
            if not qty or qty <= 0:
                continue
            month_key = iso_date[:7].replace("-", "")
            purchase_orders.append(
                {
                    "id": f"MRP-{code}-{month_key}",
                    "materialId": code,
                    "poNumber": f"PO-{code}-{month_key}",
                    "orderDate": today_iso,
                    "qty": round(qty),
                    "expectedArrivalDate": iso_date,
                    "status": "outstanding",
                    "notes": "Imported from MRP sheet incoming schedule",
                }
            )

        for col, iso_date in demand_dates.items():
            if not iso_date:
                continue
            qty = as_number(ws2.cell(row=r, column=col).value)
            if not qty or qty <= 0:
                continue
            month_key = iso_date[:7].replace("-", "")
            production_plan.append(
                {
                    "id": f"MRPDEM-{code}-{month_key}",
                    "materialId": code,
                    "neededByDate": iso_date,
                    "qty": round(qty),
                    "source": "MRP forecast",
                    "notes": "Imported from MRP sheet usage forecast",
                }
            )

    return {
        "materials": materials,
        "purchaseOrders": purchase_orders,
        "productionPlan": production_plan,
        "stats": {
            "materials": len(materials),
            "purchaseOrders": len(purchase_orders),
            "productionPlan": len(production_plan),
            "mrpRowsMatched": matched,
            "mrpRowsSkippedNoMaterial": skipped,
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx_path")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of materials (for a test batch)")
    parser.add_argument("--out", default="mrp_import.json")
    args = parser.parse_args()

    result = extract(args.xlsx_path, args.limit)
    with open(args.out, "w") as f:
        json.dump(result, f, indent=2)

    print(json.dumps(result["stats"], indent=2))
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
