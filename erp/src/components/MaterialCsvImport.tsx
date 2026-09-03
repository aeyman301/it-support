import { useMemo, useState } from "react";
import type { Material } from "../types";
import { updateMaterial } from "../lib/repo";
import { parseCsv } from "../lib/csv";

type FieldKey =
  | "code"
  | "name"
  | "uom"
  | "leadTimeDays"
  | "safetyStock"
  | "minOrderQty"
  | "onHandQty"
  | "supplier"
  | "shipFrom";

const FIELD_LABELS: Record<FieldKey, string> = {
  code: "Inventory item code",
  name: "Name",
  uom: "UoM",
  leadTimeDays: "Lead time (days)",
  safetyStock: "Safety stock",
  minOrderQty: "Min order qty",
  onHandQty: "On-hand qty",
  supplier: "Supplier",
  shipFrom: "Ships from",
};

const FIELD_ALIASES: Record<FieldKey, string[]> = {
  code: [
    "code",
    "material code",
    "part no",
    "part number",
    "pna part no",
    "component part no",
    "sku",
    "item code",
  ],
  name: ["name", "description", "material name", "part name", "item name"],
  uom: ["uom", "unit", "unit of measure", "u0m"],
  leadTimeDays: [
    "lead time",
    "lead time (days)",
    "lead time(days)",
    "leadtime",
    "lead time days",
    "lt",
    "lt (days)",
  ],
  safetyStock: ["safety stock", "safetystock", "min stock", "minimum stock", "safety qty"],
  minOrderQty: ["min order qty", "moq", "minimum order qty", "min order quantity", "min qty"],
  onHandQty: [
    "on hand",
    "on-hand",
    "on hand qty",
    "onhand",
    "stock",
    "current stock",
    "quantity on hand",
  ],
  supplier: ["supplier", "supplier name", "vendor"],
  shipFrom: [
    "ships from",
    "ship from",
    "shipping point",
    "shipping origin",
    "origin",
    "port of origin",
  ],
};

const NUMERIC_FIELDS: FieldKey[] = ["leadTimeDays", "safetyStock", "minOrderQty", "onHandQty"];

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function autoMapColumns(headers: string[]): Record<FieldKey, string> {
  const normalized = headers.map(normalizeHeader);
  const mapping = {} as Record<FieldKey, string>;
  (Object.keys(FIELD_ALIASES) as FieldKey[]).forEach((field) => {
    const aliases = FIELD_ALIASES[field];
    let idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx === -1) idx = normalized.findIndex((h) => aliases.some((a) => h.includes(a)));
    mapping[field] = idx >= 0 ? headers[idx] : "";
  });
  return mapping;
}

export function MaterialCsvImport({ materials }: { materials: Material[] }) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ updated: number; unmatched: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const materialByCode = useMemo(() => {
    const map = new Map<string, Material>();
    for (const m of materials) map.set(m.code.trim().toLowerCase(), m);
    return map;
  }, [materials]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) {
        setError("Couldn't find a header row in this file.");
        setHeaders([]);
        setRows([]);
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMapColumns(parsed.headers));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    e.target.value = "";
  }

  const codeColumn = mapping.code;
  const codeColIdx = codeColumn ? headers.indexOf(codeColumn) : -1;
  const matchableCount = codeColIdx >= 0 ? rows.filter((r) => r[codeColIdx]?.trim()).length : 0;

  function updateMapping(field: FieldKey, header: string) {
    setMapping((m) => ({ ...m, [field]: header }));
  }

  async function runImport() {
    if (codeColIdx < 0) return;
    setImporting(true);
    setResult(null);

    const fieldIdx: Partial<Record<FieldKey, number>> = {};
    (Object.keys(mapping) as FieldKey[]).forEach((f) => {
      if (f !== "code" && mapping[f]) fieldIdx[f] = headers.indexOf(mapping[f]);
    });

    const jobs: { id: string; payload: Partial<Material> }[] = [];
    const unmatched: string[] = [];

    for (const row of rows) {
      const code = row[codeColIdx]?.trim();
      if (!code) continue;
      const material = materialByCode.get(code.toLowerCase());
      if (!material) {
        unmatched.push(code);
        continue;
      }
      const payload: Partial<Material> = {};
      (Object.keys(fieldIdx) as FieldKey[]).forEach((f) => {
        const idx = fieldIdx[f];
        if (idx === undefined) return;
        const raw = row[idx]?.trim();
        if (!raw) return;
        if (NUMERIC_FIELDS.includes(f)) {
          const num = Number(raw.replace(/,/g, ""));
          if (!Number.isNaN(num)) (payload as Record<string, unknown>)[f] = num;
        } else {
          (payload as Record<string, unknown>)[f] = raw;
        }
      });
      if (Object.keys(payload).length > 0) jobs.push({ id: material.id, payload });
    }

    setProgress({ done: 0, total: jobs.length });
    const CONCURRENCY = 20;
    let cursor = 0;
    async function worker() {
      while (cursor < jobs.length) {
        const job = jobs[cursor++];
        await updateMaterial(job.id, job.payload);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker),
    );

    setResult({ updated: jobs.length, unmatched });
    setImporting(false);
  }

  return (
    <section className="card">
      <h2>Import lead times from a spreadsheet</h2>
      <p className="hint">
        Upload a CSV export of your lead-time spreadsheet (in Excel or Google
        Sheets: File → Save As / Download → CSV). Rows are matched to
        inventory items by code — matching items are updated, unmatched
        codes are skipped and listed after import. No new inventory items
        are created.
      </p>

      <div className="file-picker">
        <label className="file-picker-button">
          Choose CSV file
          <input type="file" accept=".csv,text/csv" onChange={onFile} />
        </label>
        {fileName && <span className="file-picker-name">{fileName}</span>}
      </div>

      {error && <div className="error">{error}</div>}

      {headers.length > 0 && (
        <>
          <div className="csv-mapping">
            {(Object.keys(FIELD_LABELS) as FieldKey[]).map((field) => (
              <label key={field}>
                {FIELD_LABELS[field]}
                {field === "code" ? " *" : ""}
                <select
                  value={mapping[field] ?? ""}
                  onChange={(e) => updateMapping(field, e.target.value)}
                >
                  <option value="">— not in file —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {!codeColumn && (
            <p className="error">
              Pick which column holds the inventory item code before importing.
            </p>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    {headers.map((_, ci) => (
                      <td key={ci}>{r[ci]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint hint-inline">
            Showing first {Math.min(5, rows.length)} of {rows.length} row(s).
          </p>

          <div className="form-actions">
            <button
              type="button"
              onClick={runImport}
              disabled={!codeColumn || importing || matchableCount === 0}
            >
              {importing
                ? `Importing… ${progress.done}/${progress.total}`
                : `Import ${matchableCount} row(s)`}
            </button>
          </div>

          {result && (
            <p className="hint">
              Updated {result.updated} inventory item(s).
              {result.unmatched.length > 0 && (
                <>
                  {" "}
                  {result.unmatched.length} code(s) not found in your
                  inventory list: {result.unmatched.slice(0, 15).join(", ")}
                  {result.unmatched.length > 15 ? "…" : ""}
                </>
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}
