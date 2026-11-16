export interface FacetCount {
  label: string;
  count: number;
}

export interface YearBar {
  year: number;
  count: number;
  /** Bar height as a share of the busiest year, 0–100. */
  percent: number;
}

/**
 * Turns publicationYear facet values into consecutive yearly bars. Values are
 * grouped by their first four digits (a deposit may store a full date) and
 * values that do not start with a year are ignored. Missing years between the
 * first and last are filled with zero; only the most recent `maxYears` remain.
 */
export function yearSeries(values: readonly FacetCount[], maxYears = 25): YearBar[] {
  const totals = new Map<number, number>();
  for (const { label, count } of values) {
    const match = /^(\d{4})/.exec(label?.trim() ?? '');
    if (match && count > 0) {
      const year = Number(match[1]);
      totals.set(year, (totals.get(year) ?? 0) + count);
    }
  }
  if (totals.size === 0) {
    return [];
  }
  const years = [...totals.keys()];
  const last = Math.max(...years);
  const first = Math.max(Math.min(...years), last - maxYears + 1);
  const bars: YearBar[] = [];
  for (let year = first; year <= last; year++) {
    bars.push({ year, count: totals.get(year) ?? 0, percent: 0 });
  }
  const peak = Math.max(...bars.map((bar) => bar.count));
  return bars.map((bar) => ({ ...bar, percent: peak ? Math.round((bar.count / peak) * 100) : 0 }));
}

/** Query parameters of the works search limited to one publication year. */
export function yearSearchParams(year: number): Record<string, string> {
  return {
    'configuration': 'academic_works_search',
    'f.dateIssued.min': String(year),
    'f.dateIssued.max': String(year),
  };
}
