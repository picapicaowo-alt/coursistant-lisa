const ENTITY: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Turns stored feedback HTML back into the textarea value graders edit. */
export const htmlToPlainText = (html: string): string => html
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, value: string) => {
    if (value[0] === '#') {
      const code = value[1]?.toLowerCase() === 'x'
        ? Number.parseInt(value.slice(2), 16)
        : Number.parseInt(value.slice(1), 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    }
    return ENTITY[value.toLowerCase()] ?? '';
  })
  .replace(/\n{3,}/g, '\n\n')
  .trim();
