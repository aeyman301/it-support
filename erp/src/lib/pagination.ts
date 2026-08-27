import { useMemo, useState } from "react";

/** Client-side search + pagination for a list that's too long to show at once. */
export function usePagedSearch<T>(
  items: T[],
  matches: (item: T, query: string) => boolean,
  pageSize = 25,
) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => matches(item, q));
  }, [items, query, matches]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  function setQueryAndResetPage(next: string) {
    setQuery(next);
    setPage(1);
  }

  return {
    query,
    setQuery: setQueryAndResetPage,
    page: safePage,
    setPage,
    pageCount,
    pageItems,
    total: filtered.length,
  };
}

/** Page numbers to render, with '…' gaps for a long run (e.g. 1 … 8 9 10 … 29). */
export function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  const range: (number | "…")[] = [1];
  if (left > 2) range.push("…");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("…");
  range.push(total);
  return range;
}
