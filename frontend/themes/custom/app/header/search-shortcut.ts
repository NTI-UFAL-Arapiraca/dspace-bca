/**
 * True when "/" was pressed outside any editable control and without
 * modifiers, so the shortcut never steals a character the user is typing.
 */
export function isSearchShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target' | 'defaultPrevented'>): boolean {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) {
    return false;
  }
  const target = event.target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!target) {
    return true;
  }
  if (target.isContentEditable) {
    return false;
  }
  return !['INPUT', 'TEXTAREA', 'SELECT'].includes((target.tagName ?? '').toUpperCase());
}
