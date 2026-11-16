/**
 * Human name of a dc.language.iso value ("pt_BR", "en", "por") in the UI
 * language. Falls back to the stored code when the runtime cannot name it.
 */
export function documentLanguageName(code: string, uiLanguage: string): string {
  const tag = code.trim().replace(/_/g, '-');
  if (!tag || /^(other|n\/a|none)$/i.test(tag)) {
    return code;
  }
  try {
    const names = new Intl.DisplayNames([uiLanguage, 'pt-BR'], { type: 'language' });
    const name = names.of(tag);
    return name && name.toLowerCase() !== tag.toLowerCase()
      ? name.charAt(0).toLocaleUpperCase(uiLanguage) + name.slice(1)
      : code;
  } catch {
    return code;
  }
}
