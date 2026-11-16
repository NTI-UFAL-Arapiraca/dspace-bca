/**
 * Copies text to the clipboard. Uses the Clipboard API when the page runs in
 * a secure context and falls back to a hidden textarea otherwise (an http
 * address other than localhost, or a browser that refuses the API). Focus
 * returns to the element that had it. Resolves to whether the copy worked.
 */
export async function copyText(text: string, doc: Document): Promise<boolean> {
  const view = doc.defaultView;
  if (view?.isSecureContext && view.navigator.clipboard) {
    try {
      await view.navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or document not focused: try the fallback.
    }
  }
  return copyWithTextarea(text, doc);
}

function copyWithTextarea(text: string, doc: Document): boolean {
  const previous = doc.activeElement as HTMLElement | null;
  const area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.opacity = '0';
  doc.body.appendChild(area);
  area.select();
  try {
    // Deprecated but still the only clipboard access outside secure contexts.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
    previous?.focus?.({ preventScroll: true });
  }
}
