/** Keep the filename ending (including .pdf) outside the part truncated by CSS. */
export function splitPdfFilename(name: string): { start: string; end: string } {
  const characters = Array.from(name);
  const splitAt = Math.max(Math.ceil(characters.length / 2), characters.length - 16);
  return {
    start: characters.slice(0, splitAt).join(''),
    end: characters.slice(splitAt).join(''),
  };
}

/** Native options cannot use the two spans that truncate tab names with CSS. */
export function abbreviatePdfFilename(name: string): string {
  const characters = Array.from(name);
  if (characters.length <= 48) {
    return name;
  }
  return characters.slice(0, 24).join('') + '…' + characters.slice(-23).join('');
}
