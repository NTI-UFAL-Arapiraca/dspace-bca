import { degreeTranslation, lattesUrl } from './person-profile.helpers';

describe('Person profile values', () => {
  it('expands legacy degrees without treating them as jobs', () => {
    expect(degreeTranslation('Dr.ª')).toBe('person.profile.degree.doctorate');
    expect(degreeTranslation('Me.')).toBe('person.profile.degree.masters');
    expect(degreeTranslation('Ma.')).toBe('person.profile.degree.masters');
    expect(degreeTranslation('Esp.')).toBe('person.profile.degree.specialization');
    expect(degreeTranslation('Outra formação')).toBeNull();
  });
  it('only links canonical Lattes profiles', () => {
    expect(lattesUrl('http://lattes.cnpq.br/1234567890123456')).toBe('https://lattes.cnpq.br/1234567890123456');
    expect(lattesUrl('https://lattes.cnpq.br.evil.test/1234567890123456')).toBeNull();
    expect(lattesUrl('javascript:alert(1)')).toBeNull();
    expect(lattesUrl(null)).toBeNull();
  });
});
