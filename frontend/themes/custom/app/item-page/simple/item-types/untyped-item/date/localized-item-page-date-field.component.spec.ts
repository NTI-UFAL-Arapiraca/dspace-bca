import { formatMetadataDate } from './localized-item-page-date-field.component';

describe('formatMetadataDate', () => {
  it('formats a complete ISO date for Brazilian Portuguese', () => {
    expect(formatMetadataDate('2026-08-17', 'pt-BR')).toBe('17/08/2026');
    expect(formatMetadataDate('2026-08-17T13:37:53Z', 'pt_BR')).toBe('17/08/2026');
  });

  it('formats a year and month without inventing a day', () => {
    expect(formatMetadataDate('2026-08', 'pt-BR')).toBe('08/2026');
  });

  it('preserves the source value for other languages', () => {
    expect(formatMetadataDate('2026-08-17', 'en')).toBe('2026-08-17');
  });

  it('preserves years and invalid dates', () => {
    expect(formatMetadataDate('2026', 'pt-BR')).toBe('2026');
    expect(formatMetadataDate('2026-02-30', 'pt-BR')).toBe('2026-02-30');
    expect(formatMetadataDate('sem data', 'pt-BR')).toBe('sem data');
  });
});
