/**
 * ONE frontend pagination type.
 *
 * The backend is inconsistent: product-service returns `PageResponse` and
 * order-service returns `PagedResponse`, and the two may differ in field names.
 * We normalise BOTH into this single `Page<T>` in the HTTP layer so no feature
 * code ever branches on which service it came from.
 */

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Normalise an arbitrary backend page payload into Page<T>.
 * Tolerates Spring's several shapes: {content,page,size,...},
 * {content, number, size, totalElements, totalPages}, and
 * {content, pageable:{pageNumber,pageSize}, totalElements, totalPages}.
 */
export function normalisePage<T>(raw: unknown): Page<T> {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const pageable = (typeof r.pageable === "object" && r.pageable !== null
    ? r.pageable
    : {}) as Record<string, unknown>;

  const content = Array.isArray(r.content) ? (r.content as T[]) : [];
  const page = num(r.page ?? r.number ?? pageable.pageNumber, 0);
  const size = num(r.size ?? pageable.pageSize ?? content.length, content.length);
  const totalElements = num(r.totalElements, content.length);
  const totalPages = num(r.totalPages, size > 0 ? Math.ceil(totalElements / size) : 1);

  return { content, page, size, totalElements, totalPages };
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
