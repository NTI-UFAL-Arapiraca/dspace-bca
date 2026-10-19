export function lattesUrl(value: string): string | null {
  if (!value) return null;
  const match = /^https?:\/\/lattes\.cnpq\.br\/([0-9]{16})\/?$/i.exec(value.trim());
  return match ? `https://lattes.cnpq.br/${match[1]}` : null;
}

export function degreeTranslation(value: string): string | null {
  const normalized = value?.trim().toLocaleLowerCase().replace(/[.ªº\s]/g, '');
  if (['dr', 'dra', 'doutor', 'doutora', 'doutorado'].includes(normalized)) return 'person.profile.degree.doctorate';
  if (['me', 'ma', 'mestre', 'mestra', 'mestrado'].includes(normalized)) return 'person.profile.degree.masters';
  if (['esp', 'especialista', 'especialização'].includes(normalized)) return 'person.profile.degree.specialization';
  return null;
}
