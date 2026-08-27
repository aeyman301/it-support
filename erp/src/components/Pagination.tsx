import { pageRange } from "../lib/pagination";

export function Pagination({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination">
      <span className="pagination-total">{total} result(s)</span>
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </button>
        {pageRange(page, pageCount).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              className={p === page ? "page-btn active" : "page-btn"}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="page-btn"
          disabled={page === pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
