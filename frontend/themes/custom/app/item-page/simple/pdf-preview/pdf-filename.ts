/** Keep the filename ending (including .pdf) outside the part truncated by CSS. */
export function splitPdfFilename(name: string): { start: string; end: string } {
  const characters = Array.from(name);
  const splitAt = Math.max(Math.ceil(characters.length / 2), characters.length - 16);
  return {
    start: characters.slice(0, splitAt).join(''),
    end: characters.slice(splitAt).join(''),
  };
}
