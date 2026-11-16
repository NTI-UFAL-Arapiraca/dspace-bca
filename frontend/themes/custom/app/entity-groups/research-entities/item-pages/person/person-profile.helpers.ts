export function lattesUrl(value: string): string | null {
  if (!value) {return null;}
  const match = /^https?:\/\/lattes\.cnpq\.br\/([0-9]{16})\/?$/i.exec(value.trim());
  return match ? `https://lattes.cnpq.br/${match[1]}` : null;
}

export function degreeTranslation(value: string): string | null {
  const normalized = value?.trim().toLocaleLowerCase().replace(/[.ªº\s]/g, '');
  if (['dr', 'dra', 'doutor', 'doutora', 'doutorado'].includes(normalized)) {return 'person.profile.degree.doctorate';}
  if (['me', 'ma', 'mestre', 'mestra', 'mestrado'].includes(normalized)) {return 'person.profile.degree.masters';}
  if (['esp', 'especialista', 'especialização'].includes(normalized)) {return 'person.profile.degree.specialization';}
  return null;
}

/** Up to two initials for the decorative avatar of a profile without photo. */
export function personInitials(name: string | undefined): string {
  const words = (name ?? '').split(/[\s,]+/).filter((word) => /^\p{L}/u.test(word) && word.length > 2);
  if (words.length === 0) {
    return '';
  }
  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : '';
  return (first.charAt(0) + last.charAt(0)).toLocaleUpperCase('pt-BR');
}
