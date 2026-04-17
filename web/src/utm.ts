export const UTM_FIELDS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

export type UtmField = (typeof UTM_FIELDS)[number];
export type UtmParams = Partial<Record<UtmField, string>>;

/** Appends utm_* parameters for the non-empty fields. */
export function buildUtmUrl(url: string, params: UtmParams): string {
  const pairs = UTM_FIELDS.filter((field) => params[field]?.trim()).map(
    (field) => `utm_${field}=${encodeURIComponent(params[field]!.trim())}`,
  );
  if (pairs.length === 0) return url;
  return `${url}?${pairs.join('&')}`;
}

/** Reads utm_* parameters already present in a URL. */
export function readUtm(url: string): UtmParams {
  try {
    const search = new URL(url).searchParams;
    const params: UtmParams = {};
    for (const field of UTM_FIELDS) {
      const value = search.get(`utm_${field}`);
      if (value) params[field] = value;
    }
    return params;
  } catch {
    return {};
  }
}
