import type {
  Point,
  UsageReport,
} from '@dspace/core/statistics/models/usage-report.model';

export type StatisticsScope = 'site' | 'item' | 'collection' | 'community';

export interface StatisticsEntry {
  id: string;
  label: string;
  value: number;
  percentage: number;
  monthKey?: string;
  year?: string;
}

export interface StatisticsTable {
  titleKey?: string;
  title?: string;
  headers: string[];
  rows: { label: string; values: (number | string)[] }[];
}

export interface StatisticsDashboard {
  visits: number | null;
  downloads: number | null;
  ranking: StatisticsEntry[];
  months: StatisticsEntry[];
  countries: StatisticsEntry[];
  cities: StatisticsEntry[];
  tables: StatisticsTable[];
  hasData: boolean;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const REPORT_TYPES = ['TotalVisits', 'TotalVisitsPerMonth', 'TotalDownloads', 'TopCountries', 'TopCities'];

function valuesOf(point: Point): Record<string, unknown> {
  // The REST response uses a keyed object; the upstream Point interface declares an array.
  return point.values as unknown as Record<string, unknown>;
}

export function countOf(point: Point): number | null {
  const value = valuesOf(point)?.views;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function fileAccessCountOf(point: Point): number | null {
  const downloads = valuesOf(point)?.downloads;
  return typeof downloads === 'number' && Number.isFinite(downloads) && downloads >= 0
    ? downloads
    : countOf(point);
}

function entries(report: UsageReport | undefined, pointType: string, count = countOf): StatisticsEntry[] {
  const accepted = (report?.points ?? []).flatMap((point) => {
    const value = count(point);
    return point.type === pointType && value !== null ? [{
      id: point.id,
      label: point.label || point.id,
      value,
      percentage: 0,
    }] : [];
  });
  const maximum = Math.max(0, ...accepted.map((entry) => entry.value));
  return accepted.map((entry) => ({
    ...entry,
    percentage: maximum > 0 ? entry.value / maximum * 100 : 0,
  }));
}

function tableFor(report: UsageReport): StatisticsTable | null {
  if (!report.points?.length) {
    return null;
  }
  const headers = [...new Set(report.points.flatMap((point) => Object.keys(valuesOf(point) ?? {})))];
  return {
    titleKey: REPORT_TYPES.includes(report.reportType) ? `statistics.table.title.${report.reportType}` : undefined,
    title: report.reportType,
    headers,
    rows: report.points.map((point) => ({
      label: point.label || point.id,
      values: headers.map((header) => {
        const value = valuesOf(point)?.[header];
        return typeof value === 'number' || typeof value === 'string' ? value : '—';
      }),
    })),
  };
}

function monthEntry(entry: StatisticsEntry): StatisticsEntry {
  const match = /^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/.exec(entry.label);
  if (!match) {
    return entry;
  }
  return { ...entry, monthKey: `repository.statistics.month.${MONTHS.indexOf(match[1]) + 1}`, year: match[2] };
}

export function buildStatisticsDashboard(reports: UsageReport[], scope: StatisticsScope, scopeId: string): StatisticsDashboard {
  const find = (type: string) => reports.find((report) => report.reportType === type);
  const totalVisits = find('TotalVisits');
  const scopePoint = totalVisits?.points?.find((point) => point.type === scope && point.id === scopeId);
  const visits = scopePoint ? countOf(scopePoint) : null;
  const bitstreams = entries(find('TotalDownloads'), 'bitstream', fileAccessCountOf);
  const months = entries(find('TotalVisitsPerMonth'), 'date').map(monthEntry);
  const ranking = scope !== 'item'
    ? entries(totalVisits, 'item')
      .filter((entry) => UUID_PATTERN.test(entry.id))
      .sort((a, b) => b.value - a.value)
    : [];
  const countries = entries(find('TopCountries'), 'country').sort((a, b) => b.value - a.value);
  const cities = entries(find('TopCities'), 'city').sort((a, b) => b.value - a.value);
  const tables = reports.map(tableFor).filter((table): table is StatisticsTable => table !== null);
  return {
    visits: scope === 'site' ? null : visits,
    downloads: scope === 'item' && bitstreams.length > 0
      ? bitstreams.reduce((sum, entry) => sum + entry.value, 0)
      : null,
    ranking,
    months,
    countries,
    cities,
    tables,
    hasData: tables.length > 0,
  };
}
