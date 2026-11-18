export function escapeSearchColons(query: string): string {
  // An escaped character or an entire quoted phrase already has literal punctuation.
  return query.replace(/\\[\s\S]|"(?:\\[\s\S]|[^"\\])*"|:/g,
    (part) => part === ':' ? '\\:' : part);
}
