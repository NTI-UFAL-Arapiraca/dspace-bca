export interface AbstractValue {
  value: string;
  language?: string | null;
}

export interface DisplayAbstract {
  value: string;
  language: string | null;
  title: string;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  por: 'pt', eng: 'en', spa: 'es', fra: 'fr', fre: 'fr',
  deu: 'de', ger: 'de', ita: 'it',
};

const ABSTRACT_TITLES: Record<string, string> = {
  pt: 'Resumo',
  en: 'Abstract',
  es: 'Resumen',
  fr: 'Résumé',
  de: 'Zusammenfassung',
  it: 'Riassunto',
};

type LanguageNamesConstructor = new (
  locales: string[], options: { type: 'language'; fallback: 'none' },
) => { of: (language: string) => string | undefined };

function normalizeLanguage(language?: string | null): string | null {
  if (!language?.trim() || language === 'und') {
    return null;
  }
  const [base, ...parts] = language.trim().replace(/_/g, '-').split('-');
  const normalized = [LANGUAGE_ALIASES[base.toLowerCase()] ?? base.toLowerCase(), ...parts].join('-');
  try {
    return Intl.getCanonicalLocales(normalized)[0];
  } catch {
    return null;
  }
}

function languageName(language: string, locale: string): string {
  // DisplayNames is optional on older browsers; the qualifier is a useful fallback.
  const DisplayNames = (Intl as unknown as { DisplayNames?: LanguageNamesConstructor }).DisplayNames;
  try {
    const name = DisplayNames && new DisplayNames(
      [locale.replace(/_/g, '-')], { type: 'language', fallback: 'none' },
    ).of(language);
    return name ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) : language;
  } catch {
    return language;
  }
}

/** Preserve every value, with Portuguese first, English next and other languages in source order. */
export function displayAbstracts(values: AbstractValue[], locale = 'pt-BR', summaryLabel = 'Resumo'): DisplayAbstract[] {
  return values.filter(({ value }) => value?.trim()).map(({ value, language }) => {
    const normalized = normalizeLanguage(language);
    const base = normalized?.split('-')[0];
    const title = ABSTRACT_TITLES[base] ?? (language?.trim() && language.trim() !== 'und'
      ? `${summaryLabel} (${languageName(normalized ?? language.trim(), locale)})`
      : summaryLabel);
    return { value, language: normalized, title };
  }).sort((a, b) => languageOrder(a.language) - languageOrder(b.language));
}

function languageOrder(language: string | null): number {
  const base = language?.split('-')[0];
  return base === 'pt' ? 0 : base === 'en' ? 1 : 2;
}
